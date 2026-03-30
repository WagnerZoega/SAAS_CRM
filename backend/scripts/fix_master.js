const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  // Inverter permissões para alinhar com o que o usuário espera
  await prisma.empresa.update({
    where: { email: 'master@wzsport.com.br' },
    data: { eh_master: true }
  });
  
  await prisma.empresa.update({
    where: { email: 'admin@wzsport.com.br' },
    data: { eh_master: false }
  });
  
  console.log('Permissões Master corrigidas!');
}

fix().finally(() => prisma.$disconnect());
