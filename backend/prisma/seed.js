const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  
  // 1. Criar Empresa Admin
  const empresa = await prisma.empresa.upsert({
    where: { email: 'contato@tailandesa.com' },
    update: {},
    create: {
      nome: 'Tailandesa Store',
      slug: 'tailandesa',
      email: 'contato@tailandesa.com',
      senha_hash: hash,
    },
  });

  // 2. Categorias
  const brasil = await prisma.categoria.upsert({
    where: { nome: 'Brasil' },
    update: {},
    create: { nome: 'Brasil', slug: 'brasil' }
  });

  const europa = await prisma.categoria.upsert({
    where: { nome: 'Europa' },
    update: {},
    create: { nome: 'Europa', slug: 'europa' }
  });

  // 3. Ligas
  const serieA = await prisma.liga.create({
    data: { nome: 'Série A', categoria_id: brasil.id }
  });

  const laliga = await prisma.liga.create({
    data: { nome: 'La Liga', categoria_id: europa.id }
  });

  // 4. Times
  const flamengo = await prisma.time.create({
    data: { nome: 'Flamengo', slug: 'flamengo', liga_id: serieA.id }
  });

  const realmadrid = await prisma.time.create({
    data: { nome: 'Real Madrid', slug: 'real-madrid', liga_id: laliga.id }
  });

  // 5. Produtos
  const p1 = await prisma.produto.create({
    data: {
      nome: 'Camisa Flamengo 24/25 Home',
      slug: 'flamengo-24-25-home',
      time_id: flamengo.id,
      foto_principal: 'https://images.yupoo.com/example/flamengo.jpg',
      preco_custo: 75.00
    }
  });

  const p2 = await prisma.produto.create({
    data: {
      nome: 'Camisa Real Madrid 24/25 Home',
      slug: 'real-madrid-24-25-home',
      time_id: realmadrid.id,
      foto_principal: 'https://images.yupoo.com/example/realmadrid.jpg',
      preco_custo: 75.00
    }
  });

  // 6. Preços da Empresa
  await prisma.precoEmpresa.create({
    data: {
      empresa_id: empresa.id,
      produto_id: p1.id,
      preco_venda: 169.90,
      margem: 126
    }
  });

  console.log('✅ Seed concluído!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
