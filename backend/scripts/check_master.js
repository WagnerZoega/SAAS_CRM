const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const master = await prisma.empresa.findUnique({ where: { email: 'master@wzsport.com.br' } });
  console.log('Master User:', master);
  
  const admins = await prisma.empresa.findMany({ where: { eh_master: true } });
  console.log('Total Masters found:', admins.length);
  admins.forEach(a => console.log(` - ${a.email}`));
}

check().finally(() => prisma.$disconnect());
