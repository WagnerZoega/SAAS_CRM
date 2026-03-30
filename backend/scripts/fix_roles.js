const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Garantir que apenas o ID 2 seja Master Admin por enquanto
  // (ou qualquer um que o usuário queira, mas o ID 2 tem nome de Master Admin)
  
  await prisma.empresa.updateMany({
    where: { id: { in: [1, 3, 4, 10] } },
    data: { eh_master: false }
  });

  await prisma.empresa.update({
    where: { id: 2 },
    data: { eh_master: true }
  });

  console.log('Roles corrigidas: Master Admin (ID 2) é o único master agora.');
  console.log('Parceiros teste voltaram a ser eh_master: false');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
