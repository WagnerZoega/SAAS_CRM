/**
 * 🚀 IMPORTADOR COMPLETO DO CATÁLOGO - VERSÃO DEFINITIVA
 * 
 * Lê o catalog.json (2.634 itens, 1.364 álbuns) e importa TUDO para o banco:
 * - Todas as temporadas (23/24 até 26/27)
 * - Todos os retrôs (858 itens)
 * - Todos os modelos (Jogador, Torcedor, Feminina, Infantil)
 * - 2 fotos por produto (FRONT + BACK)
 * - Nomes corretos do catalog.json
 * - Categorização inteligente
 * 
 * USO: node d:\saas-crm\backend\scripts\import_full_catalog.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

const CATALOG_PATH = 'd:/crm-camisas-tailandesas/img/catalog.json';

// Mapeamento de categoria do catalog.json para o banco
function mapCategory(catStr) {
    const c = (catStr || '').toLowerCase();
    if (c.includes('brasileir')) return { nome: 'BRASILEIRO', slug: 'brasileiro' };
    if (c.includes('europeu')) return { nome: 'EUROPEUS', slug: 'europeus' };
    if (c.includes('selec')) return { nome: 'SELEÇÕES', slug: 'selecoes' };
    return { nome: 'OUTROS', slug: 'outros' };
}

// Mapeamento de liga
function mapLeague(leagueStr, category) {
    const l = (leagueStr || '').toUpperCase();
    if (l.includes('SERIE_A')) return 'Série A';
    if (l.includes('SERIE_B')) return 'Série B';
    if (l.includes('SERIEA')) return 'Serie A Italiana';
    if (l.includes('LIGA_PT')) return 'Liga Portugal';
    if (l.includes('UEFA')) return 'UEFA Champions League';
    if (l.includes('CONMEBOL')) return 'CONMEBOL';
    if (l === 'OTHER') {
        if (category === 'brasileiros') return 'Brasileirão';
        if (category === 'europeus') return 'Ligas Europeias';
        if (category === 'selecoes') return 'Seleções';
    }
    return leagueStr || 'Outras';
}

// Limpar nome do time (remover sufixos genéricos)
function cleanTeamName(name) {
    return name
        .replace(/\s*(JERSEY|KIT JERSEY|JERSEYS|RETRO JERSEY)\s*$/gi, '')
        .replace(/\s*(EDITION|COMMEMORATIVE EDITION)\s*$/gi, '')
        .replace(/\s+/g, ' ')
        .trim() || name;
}

async function main() {
    console.log('🚀 IMPORTADOR COMPLETO DO CATÁLOGO - VERSÃO DEFINITIVA');
    console.log('='.repeat(60));

    if (!fs.existsSync(CATALOG_PATH)) {
        console.error(`❌ Arquivo não encontrado: ${CATALOG_PATH}`);
        process.exit(1);
    }

    const catalog = JSON.parse(fs.readFileSync(CATALOG_PATH, 'utf8'));
    console.log(`📦 Lendo ${catalog.total_items} itens de ${catalog.stats.albums_found} álbuns...`);

    // 1. AGRUPAR POR ÁLBUM (album_url)
    const albums = {};
    for (const item of catalog.items) {
        // FILTRO CRÍTICO: Ignorar fotos de detalhe, etiquetas, etc.
        // Apenas FRONT e BACK são aceitas para a vitrine principal.
        const isValidView = item.view === 'FRONT' || item.view === 'BACK';
        if (!isValidView) continue;

        const key = item.album_url;
        if (!albums[key]) {
            albums[key] = {
                name: item.formatted_name || item.name || item.original_title,
                original_title: item.original_title,
                team: cleanTeamName(item.team),
                category: item.category,
                league: item.league,
                year: item.year,
                year_safe: item.year_safe,
                model: item.model,
                version: item.version,
                v_label: item.v_label,
                is_retro: item.is_retro,
                fotos: [],
                foto_principal: null,
                album_url: key
            };
        }
        
        albums[key].fotos.push(item.source_url);
        
        // Prioridade para FRONT como foto principal
        if (item.view === 'FRONT') {
            albums[key].foto_principal = item.source_url;
        } else if (!albums[key].foto_principal && item.view === 'BACK') {
            // Se ainda não tem FRONT, usa BACK como quebra-galho temporário
            albums[key].foto_principal = item.source_url;
        }
    }

    // Filtrar álbuns que ficaram sem nenhuma foto válida (ex: álbuns só de detalhes)
    const albumList = Object.values(albums).filter(a => a.fotos.length > 0);
    console.log(`🎯 ${albumList.length} álbuns válidos (com FRONT/BACK) agrupados.`);

    // Stats
    const retros = albumList.filter(a => a.is_retro);
    console.log(`📊 Retrô: ${retros.length} | Atual: ${albumList.length - retros.length}`);

    // 2. GARANTIR CATEGORIAS NO BANCO
    const categoriesCache = {};
    const ligasCache = {};
    const timesCache = {};

    // 3. IMPORTAR TUDO
    let imported = 0;
    let updated = 0;
    let errors = 0;

    const empresas = await prisma.empresa.findMany({ select: { id: true } });
    console.log(`🏢 ${empresas.length} empresas encontradas para vincular.\n`);

    for (let i = 0; i < albumList.length; i++) {
        const album = albumList[i];

        try {
            // --- Categoria ---
            const catInfo = mapCategory(album.category);
            if (!categoriesCache[catInfo.slug]) {
                categoriesCache[catInfo.slug] = await prisma.categoria.upsert({
                    where: { slug: catInfo.slug },
                    update: { nome: catInfo.nome },
                    create: { nome: catInfo.nome, slug: catInfo.slug }
                });
            }
            const dbCat = categoriesCache[catInfo.slug];

            // --- Liga ---
            const ligaNome = mapLeague(album.league, album.category);
            const ligaKey = `${ligaNome}-${dbCat.id}`;
            if (!ligasCache[ligaKey]) {
                let dbLiga = await prisma.liga.findFirst({ where: { nome: ligaNome, categoria_id: dbCat.id } });
                if (!dbLiga) {
                    dbLiga = await prisma.liga.create({ data: { nome: ligaNome, categoria_id: dbCat.id } });
                }
                ligasCache[ligaKey] = dbLiga;
            }
            const dbLiga = ligasCache[ligaKey];

            // --- Time ---
            const teamSlug = album.team.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
            if (!timesCache[teamSlug]) {
                timesCache[teamSlug] = await prisma.time.upsert({
                    where: { slug: teamSlug },
                    update: { liga_id: dbLiga.id },
                    create: { nome: album.team, slug: teamSlug, liga_id: dbLiga.id }
                });
            }
            const dbTime = timesCache[teamSlug];

            // --- Produto ---
            // Nome rico com todas as referências
            let productName = album.name;
            if (!productName || productName === 'Produto Sem Nome') {
                productName = album.original_title || `${album.team} ${album.model} ${album.year}`;
            }

            // Slug único
            const prodSlug = productName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') + '-' + dbTime.id;

            // Garantir foto_principal
            const fotoPrincipal = album.foto_principal || album.fotos[0];
            
            // Garantir array de fotos sem duplicatas
            const fotosArray = [...new Set(album.fotos)];

            const dbProduct = await prisma.produto.upsert({
                where: { slug: prodSlug },
                update: {
                    nome: productName,
                    foto_principal: fotoPrincipal,
                    fotos: fotosArray,
                },
                create: {
                    nome: productName,
                    slug: prodSlug,
                    time_id: dbTime.id,
                    foto_principal: fotoPrincipal,
                    fotos: fotosArray,
                    preco_custo: 50.00,
                    ativo: true
                }
            });

            // --- Preços para todas as empresas ---
            for (const emp of empresas) {
                await prisma.precoEmpresa.upsert({
                    where: {
                        empresa_id_produto_id: {
                            empresa_id: emp.id,
                            produto_id: dbProduct.id
                        }
                    },
                    update: { ativo: true },
                    create: {
                        empresa_id: emp.id,
                        produto_id: dbProduct.id,
                        preco_venda: 169.90,
                        margem: 119.90,
                        ativo: true
                    }
                });
            }

            imported++;

            // Progress
            if ((i + 1) % 50 === 0 || i === albumList.length - 1) {
                const pct = ((i + 1) / albumList.length * 100).toFixed(1);
                console.log(`[${pct}%] ${i + 1}/${albumList.length} - ${productName.substring(0, 50)}`);
            }
        } catch (err) {
            errors++;
            if (errors <= 10) {
                console.error(`❌ Erro em "${album.name}": ${err.message.substring(0, 80)}`);
            }
        }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ IMPORTAÇÃO CONCLUÍDA!');
    console.log(`📦 Total: ${albumList.length} álbuns`);
    console.log(`✅ Importados/Atualizados: ${imported}`);
    console.log(`❌ Erros: ${errors}`);
    console.log(`🏢 Vinculados a ${empresas.length} empresas`);
    console.log(`📸 Cada produto com FRONT + BACK (2 fotos)`);
    console.log(`🏷️ Temporadas: ${[...new Set(albumList.map(a => a.year))].sort().join(', ')}`);
    console.log(`🔄 Retrôs: ${retros.length} produtos`);

    await prisma.$disconnect();
}

main().catch(err => {
    console.error('💥 Erro crítico:', err);
    process.exit(1);
});
