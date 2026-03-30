/**
 * clean_retro_remnants.js
 * Limpa os times restantes na liga RETRO: merge de nomes com sufixos e redistribuição
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: [] });

function extractCleanTeamName(name) {
    let n = name.toUpperCase();
    n = n.replace(/&#[xX]27;/g, "'").replace(/&amp;/g, '&');
    n = n.replace(/\bLONG[-\s]?SLEEVE[D]?\b/gi, '').trim();
    n = n.replace(/\b110TH ANNIVERSARY\b/gi, '').trim();
    n = n.replace(/\bJERSE[Y]?\b/gi, '').trim();
    n = n.replace(/\b'S\b/gi, '').trim();
    n = n.replace(/\s{2,}/g, ' ').replace(/\s*-\s*$/, '').trim();
    return n;
}

const EXTRA_MAPPINGS = {
    'ST. PAULI': 'SERIE A',
    'WERDER BREMEN': 'SERIE A',
    'GIRONDINS BORDEAUX': 'LA LIGA',
    'ATLÉTICO ROSARIO CENTRAL': 'LA LIGA',
};

async function main() {
    console.log('🧹 LIMPEZA DE REMANESCENTES RETRO');
    
    const retroLigas = await prisma.$queryRawUnsafe(`SELECT id FROM ligas WHERE nome = 'RETRO' LIMIT 1`);
    if (retroLigas.length === 0) { console.log('✅ Liga RETRO já não existe!'); process.exit(0); }
    const retroId = retroLigas[0].id;
    
    const retroTimes = await prisma.$queryRawUnsafe(`SELECT id, nome FROM times WHERE liga_id = ${retroId}`);
    console.log(`📋 ${retroTimes.length} times restantes em RETRO`);
    
    let moved = 0;
    for (const time of retroTimes) {
        const cleanName = extractCleanTeamName(time.nome);
        
        // Verificar se existe um time com o nome limpo em outra liga
        const existing = await prisma.$queryRawUnsafe(
            `SELECT t.id, t.nome, l.nome as liga_nome FROM times t JOIN ligas l ON t.liga_id = l.id WHERE UPPER(t.nome) = '${cleanName.replace(/'/g, "''")}' AND t.liga_id != ${retroId} LIMIT 1`
        );
        
        if (existing.length > 0) {
            // Merge com o time existente
            await prisma.$executeRawUnsafe(`UPDATE produtos SET time_id = ${existing[0].id} WHERE time_id = ${time.id}`);
            await prisma.$executeRawUnsafe(`DELETE FROM times WHERE id = ${time.id}`);
            console.log(`   🔗 Merged: "${time.nome}" → "${existing[0].nome}" (${existing[0].liga_nome})`);
            moved++;
        } else {
            // Tentar o mapeamento manual
            const targetLeague = EXTRA_MAPPINGS[cleanName];
            if (targetLeague) {
                const destLiga = await prisma.$queryRawUnsafe(`SELECT id FROM ligas WHERE nome = '${targetLeague}' LIMIT 1`);
                if (destLiga.length > 0) {
                    // Renomear e mover
                    const newSlug = cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                    try {
                        await prisma.$executeRawUnsafe(`UPDATE times SET nome = '${cleanName.replace(/'/g, "''")}', slug = '${newSlug}', liga_id = ${destLiga[0].id} WHERE id = ${time.id}`);
                        console.log(`   ✅ Movido+Renomeado: "${time.nome}" → "${cleanName}" (${targetLeague})`);
                        moved++;
                    } catch (e) {
                        // Slug conflict: merge
                        const target = await prisma.$queryRawUnsafe(`SELECT id FROM times WHERE slug = '${newSlug}' AND id != ${time.id} LIMIT 1`);
                        if (target.length > 0) {
                            await prisma.$executeRawUnsafe(`UPDATE produtos SET time_id = ${target[0].id} WHERE time_id = ${time.id}`);
                            await prisma.$executeRawUnsafe(`DELETE FROM times WHERE id = ${time.id}`);
                            console.log(`   🔗 Merged (slug): "${time.nome}" → "${cleanName}" (${targetLeague})`);
                            moved++;
                        }
                    }
                }
            } else {
                console.log(`   ℹ️ Sem destino para: "${time.nome}" (limpo: "${cleanName}")`);
            }
        }
    }
    
    // Verificar estado final
    const remaining = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as c FROM times WHERE liga_id = ${retroId}`);
    const retCount = Number(remaining[0].c);
    
    if (retCount === 0) {
        await prisma.$executeRawUnsafe(`DELETE FROM ligas WHERE id = ${retroId}`);
        const catRetro = await prisma.$queryRawUnsafe(`SELECT id FROM categorias WHERE slug = 'retro' LIMIT 1`);
        if (catRetro.length > 0) {
            await prisma.$executeRawUnsafe(`DELETE FROM categorias WHERE id = ${catRetro[0].id}`);
        }
        console.log('\n🗑️ Liga e categoria RETRO removidas (vazias)');
    }
    
    console.log(`\n📊 Resumo: ${moved} movidos, ${retCount} restantes em RETRO`);
    await prisma.$disconnect();
    process.exit(0);
}

main().catch(e => { console.error(e.message); process.exit(1); });
