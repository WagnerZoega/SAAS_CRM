const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function linkProducts() {
    try {
        // Encontrar a empresa WZ Sport
        const empresa = await prisma.empresa.findUnique({ where: { slug: 'wz-sport' } });
        if (!empresa) {
            console.log('❌ Empresa wz-sport não encontrada');
            process.exit(1);
        }
        console.log(`✅ Empresa: ${empresa.nome} (ID: ${empresa.id})`);

        // SQL direto para inserir em massa (muito mais rápido)
        const result = await prisma.$executeRawUnsafe(`
            INSERT INTO precos_empresas (empresa_id, produto_id, preco_venda, ativo, criado_em)
            SELECT ${empresa.id}, p.id, 89.90, true, NOW()
            FROM produtos p
            WHERE NOT EXISTS (
                SELECT 1 FROM precos_empresas pe 
                WHERE pe.empresa_id = ${empresa.id} AND pe.produto_id = p.id
            )
        `);
        console.log(`✅ ${result} produtos vinculados à loja WZ Sport`);

        // Contar total
        const total = await prisma.precoEmpresa.count({ where: { empresa_id: empresa.id } });
        console.log(`📊 Total de produtos na loja: ${total}`);

    } catch (err) {
        console.error('❌ Erro:', err.message);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}

linkProducts();
