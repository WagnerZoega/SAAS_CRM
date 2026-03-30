/**
 * 🧹 LIMPEZA DEFINITIVA DO CATÁLOGO
 * 
 * 1. Remove times duplicados (consolida variações de nome)
 * 2. Remove fotos de detalhe (só mantém FRONT/BACK completa)
 * 3. Remove produtos sem foto válida
 * 4. Limpa sufixos genéricos dos nomes de times (JERSEY, KIT, etc.)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mapa de consolidação de times
// Mapa de consolidação de times - Versão Definitiva
const TEAM_CONSOLIDATION = {
    'ATLÉTICO MINEIRO JERSEY': 'ATLÉTICO MINEIRO',
    'ATLÉTICO MINEIRO ALL SPONSOR': 'ATLÉTICO MINEIRO',
    'ATLÉTICO MINEIRO ALL SPONSORS JERSEY': 'ATLÉTICO MINEIRO',
    'ATLÉTICO MINEIRO COMMEMORATIVE EDITION BLACK': 'ATLÉTICO MINEIRO',
    'ATLÉTICO MINEIRO GOALKEEPER YELLOW': 'ATLÉTICO MINEIRO',
    'ATLÉTICO MINEIRO JERSEY BLACK': 'ATLÉTICO MINEIRO',
    'ATLÉTICO MINEIRO JERSEY YELLOW': 'ATLÉTICO MINEIRO',
    'ATLÉTICO MINEIRO KIT JERSEY': 'ATLÉTICO MINEIRO',
    'ATLÉTICO MINEIRO LIMITED EDITION BLACK KIT JERSEY': 'ATLÉTICO MINEIRO',
    'ATLÉTICO MINEIRO LIMITED EDITION BLACK WOMEN JERSEY': 'ATLÉTICO MINEIRO',
    'ATLÉTICO MINEIRO WOMEN JERSEY': 'ATLÉTICO MINEIRO',
    "ATLÉTICO MINEIRO WOMEN'S JERSEY": 'ATLÉTICO MINEIRO',
    'RETRO ATLÉTICO MINEIRO': 'ATLÉTICO MINEIRO',
    "WOMEN'S ATLÉTICO MINEIRO": 'ATLÉTICO MINEIRO',
    'ATLÉTICO JERSEY': 'ATLÉTICO MINEIRO',
    'ATLETICO MG': 'ATLÉTICO MINEIRO',
    'ATLÉTICO MG': 'ATLÉTICO MINEIRO',
    'ATLETICO MINEIRO': 'ATLÉTICO MINEIRO',
    'ATLETICO': 'ATLÉTICO MINEIRO',
    'ATLÉTICO': 'ATLÉTICO MINEIRO',
    'MINEIRO ATHLETIC COMMEMORATIVE EDITION (PICTURE )': 'ATLÉTICO MINEIRO',

    // ATHLETICO PR (Note a grafia correta com H e PR)
    'ATLETICO PARANAENSE RETRO JERSEY': 'ATHLETICO PR',
    'ATLÉTICO PARANAENSE': 'ATHLETICO PR',
    'ATLETICO PARANAENSE': 'ATHLETICO PR',
    'ATLETICO PR': 'ATHLETICO PR',
    'ATLÉTICO PR': 'ATHLETICO PR',
    'ATHLETICO PARANAENSE': 'ATHLETICO PR',
    'ATHLETICO-PR': 'ATHLETICO PR',
    'ATLÉTICO-PR': 'ATHLETICO PR',
    'ATHLETICO PR': 'ATHLETICO PR',
    
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
    'SPORTING CP': 'SPORTING CP',
    'AL AHLI': 'AL AHLI',
    'AL AHLI SAUDI GREEN KIT JERSEY': 'AL AHLI',
    'NOVOS PRODUTOS': 'OUTROS',
    'WORLD CUP PATCH': 'OUTROS',
};

async function main() {
    console.log('🧹 INICIANDO LIMPEZA DO CATÁLOGO...\n');

    // 1. Consolidar times duplicados
    console.log('--- PASSO 1: Consolidar times duplicados ---');
    const allTimes = await prisma.time.findMany({ include: { _count: { select: { produtos: true } } } });
    
    let timesMerged = 0;
    for (const time of allTimes) {
        const canonical = TEAM_CONSOLIDATION[time.nome];
        if (canonical) {
            // Encontrar ou criar o time canônico
            let targetTime = await prisma.time.findFirst({ where: { nome: canonical } });
            
            if (!targetTime) {
                // Renomear o time atual
                await prisma.time.update({
                    where: { id: time.id },
                    data: { nome: canonical, slug: canonical.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-') }
                });
                console.log(`  ✏️ Renomeado: "${time.nome}" → "${canonical}"`);
                timesMerged++;
            } else if (targetTime.id !== time.id) {
                // Mover produtos para o time canônico
                const moved = await prisma.produto.updateMany({
                    where: { time_id: time.id },
                    data: { time_id: targetTime.id }
                });
                console.log(`  🔄 Movido ${moved.count} produtos de "${time.nome}" → "${canonical}"`);
                
                // Remover time vazio (se possível)
                const remaining = await prisma.produto.count({ where: { time_id: time.id } });
                if (remaining === 0) {
                    try {
                        await prisma.time.delete({ where: { id: time.id } });
                        console.log(`  🗑️ Time vazio removido: "${time.nome}"`);
                    } catch (e) {
                        // Pode falhar se tiver constraint
                    }
                }
                timesMerged++;
            }
        }
    }
    console.log(`  ✅ ${timesMerged} times consolidados.\n`);

    // 3. Remover times sem produtos
    console.log('--- PASSO 3: Remover times vazios ---');
    const emptyTeams = await prisma.time.findMany({
        where: { produtos: { none: {} } }
    });
    for (const et of emptyTeams) {
        await prisma.time.delete({ where: { id: et.id } });
    }
    console.log(`  🗑️ ${emptyTeams.length} times vazios removidos.\n`);

    // 4. Remover produtos com apenas uma foto ou fotos de detalhe
    console.log('--- PASSO 4: Remover produtos incompletos/detalhes ---');
    const DETAIL_KEYWORDS = ['DETAIL', 'LABEL', 'LOGO', 'WASHING', 'TAG', 'PATCH'];
    const incompleteProducts = await prisma.produto.findMany({
        where: {
            OR: [
                { fotos: { isEmpty: true } },
                // Produtos com apenas 1 foto costumam ser detalhes ou de baixa qualidade
                // Usando uma heurística: se tem menos de 2 fotos, tchau.
            ]
        }
    });

    let detailsNuked = 0;
    // Buscando produtos que tenham keywords de detalhe no NOME ou na FOTO
    const allProductsForImageCheck = await prisma.produto.findMany({
        select: { id: true, nome: true, foto_principal: true, fotos: true }
    });

    for (const p of allProductsForImageCheck) {
        try {
            const name = p.nome || '';
            const foto = p.foto_principal || '';
            const fotosArray = p.fotos || [];

            const hasDetailKeyword = DETAIL_KEYWORDS.some(k => 
                name.toUpperCase().includes(k) || 
                foto.toUpperCase().includes(k)
            );
            const hasFewPhotos = fotosArray.length < 2;

            if (hasDetailKeyword || hasFewPhotos) {
                await prisma.precoEmpresa.deleteMany({ where: { produto_id: p.id } });
                await prisma.produto.delete({ where: { id: p.id } });
                detailsNuked++;
            }
        } catch (err) {
            // Ignorar erros de constraint e continuar
        }
    }
    console.log(`  🗑️ ${detailsNuked} produtos de detalhe/incompletos nukados.\n`);

    // 5. Remover times sem produtos (NOVA PASSAGEM)
    console.log('--- PASSO 5: Remover times que ficaram vazios ---');
    const finalEmptyTeams = await prisma.time.findMany({
        where: { produtos: { none: {} } }
    });
    for (const et of finalEmptyTeams) {
        await prisma.time.delete({ where: { id: et.id } }).catch(() => {});
    }
    console.log(`  🗑️ ${finalEmptyTeams.length} times vazios removidos.\n`);

    // 6. Stats finais
    const finalProducts = await prisma.produto.count();
    const finalTimes = await prisma.time.count();
    
    console.log('=== RESULTADO FINAL ===');
    console.log(`📦 Produtos Restantes: ${finalProducts}`);
    console.log(`⚽ Times Restantes: ${finalTimes}`);
    
    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
