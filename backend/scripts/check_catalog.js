const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const count = await prisma.precoEmpresa.count();
  const samples = await prisma.precoEmpresa.findMany({ take: 5 });
  console.log('Total de produtos vinculados (PrecoEmpresa):', count);
  console.log('Amostras:', JSON.stringify(samples, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
