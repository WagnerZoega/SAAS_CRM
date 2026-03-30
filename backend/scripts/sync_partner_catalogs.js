const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function sync() {
    console.log('🔄 INICIANDO SINCRONIZAÇÃO DE CATÁLOGOS DOS PARCEIROS');
    
    try {
        const empresas = await prisma.empresa.findMany({ where: { eh_master: false } });
        const produtos = await prisma.produto.findMany({ where: { ativo: true, empresa_id: null } });
        
        console.log(`📊 Parceiros para processar: ${empresas.length}`);
        console.log(`📦 Produtos globais ativos: ${produtos.length}`);
        
        for (const empresa of empresas) {
            console.log(`⚙️ Processando Loja: ${empresa.nome} (${empresa.slug})`);
            let count = 0;
            
            for (const produto of produtos) {
                // Upsert PrecoEmpresa com margem padrão de 100 reais se não existir
                const custo = parseFloat(produto.preco_custo || 50);
                const precoVenda = custo + 100;

                await prisma.precoEmpresa.upsert({
                    where: {
                        empresa_id_produto_id: {
                            empresa_id: empresa.id,
                            produto_id: produto.id
                        }
                    },
                    update: {
                        // Não alteramos se já existir, para não sobrescrever preços manuais do parceiro
                    },
                    create: {
                        empresa_id: empresa.id,
                        produto_id: produto.id,
                        preco_venda: precoVenda,
                        margem: 100,
                        ativo: true
                    }
                });
                count++;
                if (count % 100 === 0) console.log(`   ✅ ${count} produtos vinculados...`);
            }
            console.log(`✨ Finalizado para ${empresa.nome}: ${count} produtos vinculados.`);
        }
        
        console.log('🚀 SINCRONIZAÇÃO GLOBAL CONCLUÍDA COM SUCESSO!');
    } catch (error) {
        console.error('❌ ERRO NA SINCRONIZAÇÃO:', error);
    } finally {
        await prisma.$disconnect();
    }
}

sync();
