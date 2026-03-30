const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const CATEGORY_MAPPING = {
    'brasileiros': 'BRASILEIRO',
    'brasileirao': 'BRASILEIRO',
    'brasileirão': 'BRASILEIRO',
    'europeus': 'EUROPEUS',
    'ligas europeias': 'EUROPEUS',
    'seleções': 'SELEÇÕES',
    'selecoes': 'SELEÇÕES',
    'world cup': 'SELEÇÕES',
    'geral': 'GERAL'
};

const TEAM_CONSOLIDATION = {
    // ATLÉTICO
    'ATLÉTICO': 'ATLÉTICO MINEIRO',
    'ATLÉTICO-MG': 'ATLÉTICO MINEIRO',
    'ATLÉTICO MINEIRO KIT JERSEY': 'ATLÉTICO MINEIRO',
    'ATLETICO MINEIRO': 'ATLÉTICO MINEIRO',
    "ATLÉTICO MINEIRO'S": 'ATLÉTICO MINEIRO',
    'ATLÉTICO MG': 'ATLÉTICO MINEIRO',

    // ATHLETICO-PR
    'ATLÉTICO PARANAENSE': 'ATHLETICO PR',
    'ATLETICO PARANAENSE': 'ATHLETICO PR',
    'ATHLETICO PARANAENSE': 'ATHLETICO PR',
    'CAP': 'ATHLETICO PR',

    // NÁUTICO
    'NAUTICO JERSEY': 'NÁUTICO',
    "NAUTICO WOMEN'S JERSEY": 'NÁUTICO',
    'NAUTICO': 'NÁUTICO',
    "NAUTICO'S": 'NÁUTICO',
    "NAUTICO 'S": 'NÁUTICO',

    // REMO
    'REMO EDITION JERSEY': 'REMO',
    "REMO EDITION WOMEN'S JERSEY": 'REMO',
    'REMO GOALKEEPER JERSEY S 4X': 'REMO',
    'REMO JERSEY': 'REMO',
    'REMO WOMEN GOALKEEPER JERSEY': 'REMO',
    "REMO WOMEN'S JERSEY": 'REMO',
    'CLUBE DO REMO': 'REMO',
    'REMO WOMEN': 'REMO',
    'REMO': 'REMO',
    "REMO'S": 'REMO',
    "REMO 'S": 'REMO',
    'REMO GOALKEEPER': 'REMO',
    'REMO EDITION': 'REMO',

    // PAYSANDU
    'PAYSANDU JERSEY': 'PAYSANDU',
    "PAYSANDU WOMEN JERSEY": 'PAYSANDU',
    "PAYSANDU WOMEN'S JERSEY": 'PAYSANDU',
    'PAYSANDU': 'PAYSANDU',
    "PAYSANDU 'S": 'PAYSANDU',
    "PAYSANDU'S": 'PAYSANDU',
    'PAYSANDU 26/27': 'PAYSANDU',

    // SPORTING
    'SPORTING CP': 'SPORTING CP',
    'AL AHLI': 'AL AHLI',
    'AL AHLI SAUDI GREEN KIT JERSEY': 'AL AHLI',
};

async function importCatalog() {
  const catalogPath = 'd:/crm-camisas-tailandesas/img/catalog.json';
  if (!fs.existsSync(catalogPath)) {
    console.error('❌ Arquivo catalog.json não encontrado!');
    return;
  }

  const rawData = fs.readFileSync(catalogPath, 'utf8');
  const catalog = JSON.parse(rawData);

  console.log(`📦 Processando ${catalog.items.length} entradas do Yupoo...`);

  const groups = {};
  for (const item of catalog.items) {
    if (!groups[item.album_url]) {
      groups[item.album_url] = {
        ...item,
        fotos: []
      };
    }
    groups[item.album_url].fotos.push(item.source_url);
  }

  const itemsToImport = Object.values(groups);
  console.log(`🎯 Agrupado em ${itemsToImport.length} produtos únicos.`);

  const empresas = await prisma.empresa.findMany();
  
  let count = 0;
  for (const item of itemsToImport) {
    try {
      // 1. Categoria Normalizada
      const rawCat = (item.category || 'GERAL').toLowerCase();
      const catNome = CATEGORY_MAPPING[rawCat] || rawCat.toUpperCase();
      let catSlug = catNome.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remover acentos
          .replace(/[^a-z0-9]/g, '-');

      const categoria = await prisma.categoria.upsert({
        where: { slug: catSlug },
        update: {},
        create: { nome: catNome, slug: catSlug }
      });

      // 2. Liga
      const ligaNome = (item.league || 'OUTROS').toUpperCase();
      let liga = await prisma.liga.findFirst({
        where: { nome: ligaNome, categoria_id: categoria.id }
      });
      if (!liga) {
        liga = await prisma.liga.create({
          data: { nome: ligaNome, categoria_id: categoria.id }
        });
      }

      // 3. Time Consolidado
      let rawTeam = (item.team || 'OUTROS').toUpperCase();
      const teamNome = TEAM_CONSOLIDATION[rawTeam] || rawTeam;
      const teamSlug = teamNome.toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remover acentos
          .replace(/[^a-z0-9]/g, '-');

      const time = await prisma.time.upsert({
        where: { slug: teamSlug },
        update: {},
        create: { 
          nome: teamNome, 
          slug: teamSlug,
          liga_id: liga.id
        }
      });

      // 4. Seleção de Imagem (2ª foto como principal se houver > 2)
      let fotoPrincipal = item.fotos[0];
      if (item.fotos.length >= 3) {
          fotoPrincipal = item.fotos[1]; // A 2ª imagem costuma ser o item real após a thumb
      } else if (item.fotos.length === 2) {
          fotoPrincipal = item.fotos[0];
      }

      // 5. Produto
      const cleanName = item.name.split(' | ')[0]; // Remover o " | 7" do scraper
      const produtoSlug = cleanName.toLowerCase().replace(/[^a-z0-0]/g, '-') + '-' + time.id;
      
      const produto = await prisma.produto.upsert({
        where: { slug: produtoSlug },
        update: {
          foto_principal: fotoPrincipal,
          fotos: item.fotos,
          time_id: time.id // Garantir que está no time consolidado
        },
        create: {
          nome: cleanName,
          slug: produtoSlug,
          time_id: time.id,
          foto_principal: fotoPrincipal,
          fotos: item.fotos,
          preco_custo: 50.00,
          ativo: true
        }
      });

      // 6. Preços
      for (const emp of empresas) {
        await prisma.precoEmpresa.upsert({
          where: { 
            empresa_id_produto_id: {
              empresa_id: emp.id,
              produto_id: produto.id
            }
          },
          update: { ativo: true },
          create: {
            empresa_id: emp.id,
            produto_id: produto.id,
            preco_venda: 169.90,
            margem: 119.90,
            ativo: true
          }
        });
      }

      count++;
      if (count % 100 === 0) console.log(`🚀 ${count} produtos processados...`);
    } catch (err) {
      console.error(`❌ Erro ao importar item ${item.name}:`, err.message);
    }
  }

  // 7. Cleanup final de times vazios
  console.log('🧹 Limpando times que ficaram sem produtos...');
  const emptyTeams = await prisma.time.findMany({ where: { produtos: { none: {} } } });
  for (const et of emptyTeams) {
    await prisma.time.delete({ where: { id: et.id } }).catch(() => {});
  }

  console.log(`✅ Sucesso! ${count} produtos harmonizados e importados.`);
}

importCatalog()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
