const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.produto.findMany({
        take: 20
    });

    products.forEach(p => {
        console.log(`Produto: ${p.nome} | Total Fotos: ${p.fotos?.length || 0}`);
    });
}

main();
