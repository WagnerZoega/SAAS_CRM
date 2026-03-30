const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function check() {
    const total = await p.produto.count();
    const allProducts = await p.produto.findMany({
        select: { id: true, nome: true, fotos: true, foto_principal: true }
    });
    
    let with0 = 0, with1 = 0, with2 = 0, with3plus = 0;
    allProducts.forEach(prod => {
        const fLen = prod.fotos ? prod.fotos.length : 0;
        if (fLen === 0) with0++;
        else if (fLen === 1) with1++;
        else if (fLen === 2) with2++;
        else with3plus++;
    });
    
    console.log(`Total produtos no banco: ${total}`);
    console.log(`Com 0 fotos: ${with0}`);
    console.log(`Com 1 foto: ${with1}`);
    console.log(`Com 2 fotos: ${with2}`);
    console.log(`Com 3+ fotos: ${with3plus}`);
    
    const sample = allProducts.slice(0, 5);
    sample.forEach(s => {
        console.log(`  ${s.nome} -> ${s.fotos?.length || 0} fotos | principal: ${s.foto_principal?.substring(0,60)}...`);
    });
    
    await p.$disconnect();
}
check().catch(e => { console.error(e); process.exit(1); });
