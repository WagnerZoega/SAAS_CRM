const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const empresas = await prisma.empresa.count();
  const produtos = await prisma.produto.count();
  const precos = await prisma.precoEmpresa.count();
  const clientes = await prisma.cliente.count();
  const pedidos = await prisma.pedido.count();

  console.log('--- DATABASE STATS ---');
  console.log(`Empresas: ${empresas}`);
  console.log(`Produtos: ${produtos}`);
  console.log(`Preços Vinculados: ${precos}`);
  console.log(`Clientes: ${clientes}`);
  console.log(`Pedidos: ${pedidos}`);
  
  // Lista as empresas para ver os slugs e contagem de produtos
  const allEmpresas = await prisma.empresa.findMany({ 
    include: { 
      _count: { 
        select: { precos_empresas: true } 
      } 
    } 
  });
  console.log('--- EMPRESAS REGISTRADAS ---');
  allEmpresas.forEach(e => console.log(`- ${e.nome} (slug: ${e.slug}) | Produtos: ${e._count.precos_empresas}`));

  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
