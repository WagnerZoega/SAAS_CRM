const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function forceCreateUsers() {
  console.log('🚀 Forçando criação de usuários via Prisma...');
  const hash = await bcrypt.hash('123456', 10);
  
  const users = [
    { nome: 'WZ Sport Admin', email: 'admin@wzsport.com.br', slug: 'admin', senha_hash: hash, responsavel: 'Admin Master', telefone: '21981496911', faturamento_ativo: true },
    { nome: 'Tailandesa Store', email: 'contato@tailandesa.com', slug: 'tailandesa', senha_hash: hash, responsavel: 'Carlos Tailandesa', telefone: '21981496911', faturamento_ativo: true },
    { nome: 'Real Store Test', email: 'test@manager.com', slug: 'real-store', senha_hash: hash, responsavel: 'Teste User', telefone: '21981496911', faturamento_ativo: true }
  ];

  for (const user of users) {
    try {
      await prisma.empresa.upsert({
        where: { email: user.email },
        update: { senha_hash: hash, faturamento_ativo: true },
        create: user
      });
      console.log(`✅ Usuário ${user.email} garantido!`);
    } catch (err) {
      console.error(`❌ Erro em ${user.email}:`, err.message);
    }
  }
}

forceCreateUsers()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
