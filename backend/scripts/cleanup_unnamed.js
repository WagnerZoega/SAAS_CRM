const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function cleanup() {
    const bad = await p.produto.findMany({ 
        where: { nome: 'Produto Sem Nome' }, 
        select: { id: true }
    });
    console.log(`Removendo ${bad.length} produtos sem nome...`);
    
    for (const b of bad) {
        await p.precoEmpresa.deleteMany({ where: { produto_id: b.id }});
        await p.produto.delete({ where: { id: b.id }});
    }
    
    const total = await p.produto.count();
    const withNames = await p.produto.count({ where: { NOT: { nome: 'Produto Sem Nome' }}});
    console.log(`✅ Total final no banco: ${total}`);
    console.log(`✅ Com nomes corretos: ${withNames}`);
    
    // Amostra de nomes
    const sample = await p.produto.findMany({ take: 10, select: { nome: true, fotos: true }});
    sample.forEach(s => console.log(`  📸 ${s.nome} (${s.fotos?.length || 0} fotos)`));
    
    await p.$disconnect();
}

cleanup().catch(e => { console.error(e); process.exit(1); });
