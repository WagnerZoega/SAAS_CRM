const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const produtoId = 30; // Test with a recently added ID
  const prodIdInt = parseInt(produtoId);
  console.log('Testing with ID:', prodIdInt);
  
  const originalProd = await prisma.produto.findUnique({ 
    where: { id: prodIdInt }, 
    include: { time: true } 
  });
  
  if (!originalProd) {
    console.log('Produto não encontrado!');
    const all = await prisma.produto.findMany({ take: 5 });
    console.log('Last 5 products:', all.map(p => p.id));
  } else {
    console.log('Produto encontrado:', originalProd.nome);
  }
  
  process.exit();
}

test();
