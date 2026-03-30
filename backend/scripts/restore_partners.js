const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    const hash = await bcrypt.hash('Wzwz@2025Ciberntico', 10);
    const partners = [
        { nome: 'Tailandesa Store', email: 'contato@tailandesa.com', slug: 'tailandesa' },
        { nome: 'WZ Sport', email: 'master@wzsport.com.br', slug: 'wz-sport' },
        { nome: 'Partner Test 1', email: 'test@manager.com', slug: 'partner-1' },
        { nome: 'Partner Test 2', email: 'test2@manager.com', slug: 'partner-2' },
        { nome: 'Partner Test 3', email: 'test3@manager.com', slug: 'partner-3' },
        { nome: 'WZ Admin', email: 'admin@wzsport.com.br', slug: 'admin-wz' }
    ];

    for (const p of partners) {
        await prisma.empresa.upsert({
            where: { email: p.email },
            update: { 
                nome: p.nome, 
                slug: p.slug,
                eh_master: p.email === 'admin@wzsport.com.br' // Define este como o Admin Master
            },
            create: {
                nome: p.nome,
                email: p.email,
                slug: p.slug,
                senha_hash: hash,
                eh_master: p.email === 'admin@wzsport.com.br',
                telefone: '552199999999',
                responsavel: 'Suporte'
            }
        });
    }
    console.log('✅ Parceiros restaurados!');
}

main();
