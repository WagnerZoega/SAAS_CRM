const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ligas = await prisma.liga.findMany();
    console.log(ligas.map(l => l.nome));
}
main();
