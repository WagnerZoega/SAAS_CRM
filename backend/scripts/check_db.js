const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const cats = await prisma.categoria.findMany({ include: { ligas: { include: { times: true } } } });
  console.log(JSON.stringify(cats, null, 2));
  process.exit(0);
}

check();
