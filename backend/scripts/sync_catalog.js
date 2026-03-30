const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function syncCatalog() {
  console.log('📦 Iniciando atualização do catálogo Manto PRO...');

  try {
    // 1. Limpar dados antigos para fresh start (opcional, mas bom para demonstração)
    // await prisma.precoEmpresa.deleteMany({});
    // await prisma.produto.deleteMany({});

    // 2. Garantir Categorias
    const catBrasil = await prisma.categoria.upsert({
      where: { slug: 'brasil' },
      update: {},
      create: { nome: 'Brasil', slug: 'brasil' }
    });

    const catEuropa = await prisma.categoria.upsert({
      where: { slug: 'europa' },
      update: {},
      create: { nome: 'Europa', slug: 'europa' }
    });

    const catRetis = await prisma.categoria.upsert({
      where: { slug: 'retro' },
      update: {},
      create: { nome: 'Linha Retrô', slug: 'retro' }
    });

    // 3. Ligas
    const ligas = [
      { nome: 'Série A', slug: 'serie-a', catId: catBrasil.id },
      { nome: 'Série B', slug: 'serie-b', catId: catBrasil.id },
      { nome: 'La Liga', slug: 'la-liga', catId: catEuropa.id },
      { nome: 'Premier League', slug: 'premier-league', catId: catEuropa.id },
      { nome: 'Champions League', slug: 'champions-league', catId: catEuropa.id }
    ];

    const ligasMap = {};
    for (const l of ligas) {
      const created = await prisma.liga.upsert({
        where: { id: 0 }, // Fake ID for upsert pattern or just use create
        create: { nome: l.nome, categoria_id: l.catId },
        update: {}
      });
      // Better approach for seeding
      const record = await prisma.liga.findFirst({ where: { nome: l.nome } }) || 
                     await prisma.liga.create({ data: { nome: l.nome, categoria_id: l.catId } });
      ligasMap[l.slug] = record.id;
    }

    // 4. Times
    const times = [
      { nome: 'Flamengo', slug: 'flamengo', ligaId: ligasMap['serie-a'] },
      { nome: 'Palmeiras', slug: 'palmeiras', ligaId: ligasMap['serie-a'] },
      { nome: 'Botafogo', slug: 'botafogo', ligaId: ligasMap['serie-a'] },
      { nome: 'Real Madrid', slug: 'real-madrid', ligaId: ligasMap['la-liga'] },
      { nome: 'Barcelona', slug: 'barcelona', ligaId: ligasMap['la-liga'] },
      { nome: 'Manchester City', slug: 'man-city', ligaId: ligasMap['premier-league'] }
    ];

    const timesMap = {};
    for (const t of times) {
       const record = await prisma.time.upsert({
         where: { slug: t.slug },
         update: { liga_id: t.ligaId },
         create: { nome: t.nome, slug: t.slug, liga_id: t.ligaId }
       });
       timesMap[t.slug] = record.id;
    }

    // 5. Produtos (O Catálogo Real)
    const produtos = [
      {
        nome: 'Flamengo Home 24/25 - Versão Jogador',
        slug: 'flamengo-home-24-25-player',
        timeId: timesMap['flamengo'],
        foto: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800',
        descricao: 'A nova armadura do Mengão para a temporada 24/25. Tecnologia Heat.Dry, tecido ultra leve e escudo emborrachado.',
        preco_custo: 78.00
      },
      {
        nome: 'Real Madrid Third 24/25 - Dark Edition',
        slug: 'real-madrid-third-24-25',
        timeId: timesMap['real-madrid'],
        foto: 'https://images.unsplash.com/photo-1599408080693-da4a68f69133?q=80&w=800',
        descricao: 'Coleção exclusiva Real Madrid. Design minimalista em tons escuros com detalhes em dourado.',
        preco_custo: 82.00
      },
      {
        nome: 'Brasil Home 2024 - Copa América',
        slug: 'brasil-home-2024',
        timeId: await prisma.time.findFirst({ where: { slug: 'flamengo' } }).then(t => t.id), // Simplified for now
        foto: 'https://images.unsplash.com/photo-1518005020252-3b8c5c7069ad?q=80&w=800',
        descricao: 'O clássico amarelo canarinho com detalhes em verde vagem. Padrão geométrico inspirado na natureza brasileira.',
        preco_custo: 75.00
      }
    ];

    for (const p of produtos) {
      await prisma.produto.upsert({
        where: { slug: p.slug },
        update: {
          nome: p.nome,
          foto_principal: p.foto,
          descricao: p.descricao,
          preco_custo: p.preco_custo
        },
        create: {
          nome: p.nome,
          slug: p.slug,
          time_id: p.timeId,
          foto_principal: p.foto,
          descricao: p.descricao,
          preco_custo: p.preco_custo
        }
      });
    }

    console.log('✅ Catálogo atualizado com sucesso!');

  } catch (err) {
    console.error('❌ Erro no sync:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

syncCatalog();
