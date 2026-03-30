const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const cats = await prisma.categoria.findMany();
    const ligas = await prisma.liga.count();
    const times = await prisma.time.count();
    const produtos = await prisma.produto.count();

    console.log('--- DATABASE STATUS ---');
    console.log('Categorias:', cats.map(c => c.nome).join(', '));
    console.log('Total Ligas:', ligas);
    console.log('Total Times:', times);
    console.log('Total Produtos:', produtos);
    console.log('-----------------------');
  } catch (e) {
    console.error(e);
  } finally {
    await prisma.$disconnect();
  }
}

check();
