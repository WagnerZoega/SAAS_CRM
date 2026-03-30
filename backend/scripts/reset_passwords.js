const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  const emails = ['test@manager.com', 'test2@manager.com', 'contato@tailandesa.com', 'admin@wzsport.com.br'];
  
  for (const email of emails) {
    await prisma.empresa.update({
      where: { email },
      data: { senha_hash: hash }
    });
    console.log(`Senha resetada para ${email}`);
  }
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
