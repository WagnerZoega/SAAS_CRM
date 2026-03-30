const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient({ log: [] });

(async () => {
    const retro = await p.$queryRawUnsafe("SELECT t.id, t.nome, l.id as liga_id FROM times t JOIN ligas l ON t.liga_id=l.id WHERE l.nome='RETRO'");
    console.log('Times restantes em RETRO:', retro.length);
    
    for (const t of retro) {
        console.log(' -', t.nome, '(id:', t.id, ')');
        // Buscar o Flamengo no Brasileirão
        const target = await p.$queryRawUnsafe("SELECT id FROM times WHERE UPPER(nome)='FLAMENGO' AND liga_id != " + t.liga_id + " LIMIT 1");
        if (target.length > 0) {
            await p.$executeRawUnsafe(`UPDATE produtos SET time_id = ${target[0].id} WHERE time_id = ${t.id}`);
            await p.$executeRawUnsafe(`DELETE FROM times WHERE id = ${t.id}`);
            console.log('   ✅ Merged com Flamengo (id:', target[0].id, ')');
        }
    }
    
    // Limpar liga RETRO se vazia
    const retroLiga = await p.$queryRawUnsafe("SELECT id FROM ligas WHERE nome='RETRO' LIMIT 1");
    if (retroLiga.length > 0) {
        const cnt = await p.$queryRawUnsafe("SELECT COUNT(*) as c FROM times WHERE liga_id=" + retroLiga[0].id);
        if (Number(cnt[0].c) === 0) {
            await p.$executeRawUnsafe("DELETE FROM ligas WHERE id=" + retroLiga[0].id);
            const cat = await p.$queryRawUnsafe("SELECT id FROM categorias WHERE slug='retro' LIMIT 1");
            if (cat.length > 0) await p.$executeRawUnsafe("DELETE FROM categorias WHERE id=" + cat[0].id);
            console.log('🗑️ Liga e categoria RETRO removidas!');
        }
    }
    
    await p.$disconnect();
    process.exit(0);
})();
