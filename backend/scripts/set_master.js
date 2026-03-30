const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = 'test@manager.com';
  const empresa = await prisma.empresa.update({
    where: { email },
    data: { eh_master: true }
  });
  console.log(`Empresa ${empresa.nome} agora é MASTER.`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
