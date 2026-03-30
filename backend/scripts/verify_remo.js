const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const remo = await prisma.time.findFirst({
    where: { nome: 'REMO' },
    include: { produtos: true }
  });

  if (!remo) {
    console.log('Time REMO não encontrado');
    return;
  }

  console.log(`Time: ${remo.nome}`);
  console.log(`Total de Produtos: ${remo.produtos.length}`);
  
  remo.produtos.forEach(p => {
    console.log(`- Produto: ${p.nome}`);
    console.log(`  Foto Principal: ${p.foto_principal}`);
    console.log(`  Fotos: ${JSON.stringify(p.fotos)}`);
  });

  process.exit(0);
}

main().catch(console.error);
