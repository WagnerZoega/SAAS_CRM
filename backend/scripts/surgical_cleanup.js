const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const KILL_KEYWORDS = [
    'LOGO', 'SHIELD', 'ESCUDO', 'PATCH', 'LABEL', 'WASHING', 'TAG', 
    'DETAIL', 'CLOSE-UP', 'CLUSE-UP', 'STAMP', 'EMBLEM', 'BADGE', 
    'STICKER', 'BAG', 'BOX', 'PACKAGE', 'PRINT', 'NUMBER', 'NAME',
    'COLLAR', 'SLEEVE', 'CUFF', 'FABRIC', 'MATERIAL'
];

async function cleanup() {
    console.log('🚀 INICIANDO LIMPEZA CIRÚRGICA DO CATÁLOGO 🚀');
    
    const allProducts = await prisma.produto.findMany({
        select: { id: true, nome: true, foto_principal: true, fotos: true }
    });

    let nuked = 0;
    for (const p of allProducts) {
        const name = (p.nome || '').toUpperCase();
        const mainPhoto = (p.foto_principal || '').toUpperCase();
        const fotos = p.fotos || [];

        const hasKillWord = KILL_KEYWORDS.some(k => name.includes(k) || mainPhoto.includes(k));
        const tooFewPhotos = fotos.length < 2; // Real jerseys MUST have FRONT and BACK

        if (hasKillWord || tooFewPhotos) {
            try {
                console.log(`🗑️ Removendo: [${p.id}] ${p.nome} (${fotos.length} fotos)`);
                await prisma.precoEmpresa.deleteMany({ where: { produto_id: p.id } });
                await prisma.produto.delete({ where: { id: p.id } });
                nuked++;
            } catch (err) {
                console.error(`  ❌ Falha ao remover [${p.id}]: ${err.message}`);
            }
        }
    }

    console.log(`\n✅ LIMPEZA CONCLUÍDA: ${nuked} itens removidos.`);
    
    // Remover times vazios que sobraram
    const emptyTeams = await prisma.time.findMany({ where: { produtos: { none: {} } } });
    for (const et of emptyTeams) {
        await prisma.time.delete({ where: { id: et.id } }).catch(() => {});
    }
    console.log(`🏟️ ${emptyTeams.length} times vazios removidos.`);
    process.exit(0);
}

cleanup().catch(e => { console.error(e); process.exit(1); });
