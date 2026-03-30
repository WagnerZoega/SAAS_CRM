const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkNews() {
  const news = await prisma.noticiaFutebol.findMany({
    take: 10,
    orderBy: { criado_em: 'desc' }
  });
  console.log(JSON.stringify(news, null, 2));
  await prisma.$disconnect();
}

checkNews();
