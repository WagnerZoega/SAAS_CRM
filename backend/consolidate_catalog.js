const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
  console.log('🔄 Consolidando Categorias...');

  // 1. Criar as categorias oficiais
  const catBrasileiros = await prisma.categoria.upsert({
    where: { slug: 'brasileiros' },
    update: { nome: 'BRASILEIROS' },
    create: { nome: 'BRASILEIROS', slug: 'brasileiros' }
  });

  const catEuropeus = await prisma.categoria.upsert({
    where: { slug: 'europeus' },
    update: { nome: 'EUROPEUS' },
    create: { nome: 'EUROPEUS', slug: 'europeus' }
  });

  const catSelecoes = await prisma.categoria.upsert({
    where: { slug: 'selecoes' },
    update: { nome: 'SELEÇÕES' },
    create: { nome: 'SELEÇÕES', slug: 'selecoes' }
  });

  // 2. Mover ligas de categorias antigas para as novas
  // Europa -> EUROPEUS
  const oldEuropa = await prisma.categoria.findUnique({ where: { nome: 'Europa' } });
  if (oldEuropa) {
    await prisma.liga.updateMany({
      where: { categoria_id: oldEuropa.id },
      data: { categoria_id: catEuropeus.id }
    });
  }

  // Brasil -> BRASILEIROS
  const oldBrasil = await prisma.categoria.findUnique({ where: { nome: 'Brasil' } });
  if (oldBrasil) {
    await prisma.liga.updateMany({
      where: { categoria_id: oldBrasil.id },
      data: { categoria_id: catBrasileiros.id }
    });
  }

  // SELECOES -> SELEÇÕES
  const oldSelecoes = await prisma.categoria.findUnique({ where: { nome: 'SELECOES' } });
  if (oldSelecoes) {
    await prisma.liga.updateMany({
      where: { categoria_id: oldSelecoes.id },
      data: { categoria_id: catSelecoes.id }
    });
  }

  // Linha Retrô -> BRASILEIROS (ou podemos manter se o user quiser, mas vou agrupar por enquanto)
  const oldRetro = await prisma.categoria.findUnique({ where: { nome: 'Linha Retrô' } });
  if (oldRetro) {
    await prisma.liga.updateMany({
      where: { categoria_id: oldRetro.id },
      data: { categoria_id: catBrasileiros.id }
    });
  }

  // 3. Deletar categorias órfãs
  await prisma.categoria.deleteMany({
    where: {
      NOT: {
        id: { in: [catBrasileiros.id, catEuropeus.id, catSelecoes.id] }
      }
    }
  });

  // 4. Setar Preço de Custo Padrão (R$ 50) para produtos que não tem
  await prisma.produto.updateMany({
    where: { preco_custo: null },
    data: { preco_custo: 50.00 }
  });

  console.log('✅ Catálogo consolidado e limpo!');
  await prisma.$disconnect();
}

fix();
