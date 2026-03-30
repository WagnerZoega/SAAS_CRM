const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = await prisma.produto.findMany({
        take: 10,
        include: {
            time: {
                include: {
                    liga: true
                }
            }
        }
    });

    console.log(JSON.stringify(products.map(p => ({
        id: p.id,
        nome: p.nome,
        liga: p.time?.liga?.nome,
        time: p.time?.nome,
        fotos: p.fotos
    })), null, 2));
}

main();
