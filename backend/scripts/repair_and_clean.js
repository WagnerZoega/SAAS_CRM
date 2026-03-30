const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const TERMOS_DETALHE = [
    'detail', 'detalhe', 'tag', 'label', 'logo', 'badge', 'close', 'zoom', 
    'sleeve', 'manga', 'collar', 'gola', 'inside', 'dentro', 'wash', 'lavagem',
    'patch', 'fabric', 'tecido', 'stitching', 'costura', 'name', 'number', 'size',
    'icon', 'logo@558.png'
];

const ANCHORS = [
    'FLAMENGO', 'VASCO', 'CORINTHIANS', 'PALMEIRAS', 'SAO PAULO', 'SÃO PAULO', 
    'GRÊMIO', 'GREMIO', 'INTERNACIONAL', 'CRUZEIRO', 'ATLETICO MINEIRO', 
    'ATLÉTICO MINEIRO', 'BOTAFOGO', 'FLUMINENSE', 'SANTOS', 'BAHIA', 'FORTALEZA', 
    'ATHLETICO', 'REMO', 'PAYSANDU', 'NÁUTICO', 'VITÓRIA', 'CUIABÁ', 'SPORT RECIFE',
    'SANTA CRUZ', 'CEARÁ'
];

async function repairAndClean() {
  try {
    console.log('--- REPARANDO CREMONESE ---');
    
    // 1. Recriar Cremonese
    let remoTeam = await prisma.time.findFirst({ where: { nome: 'REMO' } });
    if (remoTeam) {
      let cremonese = await prisma.time.findFirst({ where: { nome: 'CREMONESE' } });
      if (!cremonese) {
        // Encontrar a Liga Europeus
        const ligaEuropeus = await prisma.liga.findFirst({
            where: { nome: { contains: 'EUROPE' } }
        });
        
        if (!ligaEuropeus) throw new Error('Liga EUROPEUS não encontrada.');

        cremonese = await prisma.time.create({
          data: {
            nome: 'CREMONESE',
            slug: 'cremonese',
            liga_id: ligaEuropeus.id
          }
        });
        console.log(`Time CREMONESE recriado na liga ID ${ligaEuropeus.id}.`);
      }

      // Mover de volta produtos do Cremonese
      const moved = await prisma.produto.updateMany({
        where: {
          time_id: remoTeam.id,
          nome: { contains: 'Cremonese', mode: 'insensitive' }
        },
        data: { time_id: cremonese.id }
      });
      console.log(`Restaurados ${moved.count} produtos para o Cremonese.`);
    }

    // 2. UNIFICAÇÃO DE TIMES (COM WORD BOUNDARIES)
    console.log('\n--- UNIFICANDO TIMES (ESTRITO) ---');
    const allTeams = await prisma.time.findMany({
      include: { _count: { select: { produtos: true } } }
    });

    for (const team of allTeams) {
      const upperName = team.nome.toUpperCase();
      let targetName = null;

      for (const anchor of ANCHORS) {
        // Usar Regex para word boundary
        const regex = new RegExp(`\\b${anchor}\\b`, 'i');
        if (regex.test(upperName) && upperName !== anchor) {
          targetName = anchor;
          break;
        }
      }

      if (targetName) {
        let targetTeam = allTeams.find(t => t.nome.toUpperCase() === targetName);
        if (targetTeam && targetTeam.id !== team.id) {
          console.log(`Unificando: "${team.nome}" -> "${targetTeam.nome}"`);
          const moved = await prisma.produto.updateMany({
            where: { time_id: team.id },
            data: { time_id: targetTeam.id }
          });
          console.log(`  Movidos ${moved.count} produtos.`);
          try { await prisma.time.delete({ where: { id: team.id } }); } catch (e) {}
        }
      }
    }

    // 3. LIMPEZA DE FOTOS (ROBUSTA)
    console.log('\n--- LIMPANDO FOTOS ---');
    const produtos = await prisma.produto.findMany({
      where: { ativo: true },
      take: 5000 // Limite para evitar timeout, rodar em lotes se necessário
    });

    let cleanedCount = 0;
    for (const prod of produtos) {
      if (!prod.fotos || !Array.isArray(prod.fotos) || prod.fotos.length === 0) continue;

      const cleanFotos = prod.fotos.filter(f => {
        const url = (typeof f === 'string' ? f : (f.url || '')).toLowerCase();
        return !TERMOS_DETALHE.some(termo => url.includes(termo));
      });

      const finalFotos = cleanFotos.length >= 2 ? cleanFotos.slice(0, 2) : prod.fotos.slice(0, 2);

      if (finalFotos.length !== prod.fotos.length) {
        await prisma.produto.update({
          where: { id: prod.id },
          data: { fotos: finalFotos }
        });
        cleanedCount++;
      }
    }
    console.log(`Fotos de ${cleanedCount} produtos filtradas (apenas frente/verso).`);

    console.log('\n✅ PROCESSO CONCLUÍDO');

  } catch (err) {
    console.error('ERRO:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

repairAndClean();
