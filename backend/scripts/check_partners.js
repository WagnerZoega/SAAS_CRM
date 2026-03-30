const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const empresas = await prisma.empresa.findMany();
  console.log('--- LISTA DE PARCEIROS ---');
  console.log(JSON.stringify(empresas, null, 2));
  console.log('Total:', empresas.length);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
