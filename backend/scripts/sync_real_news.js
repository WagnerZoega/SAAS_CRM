const { PrismaClient } = require('@prisma/client');
const Parser = require('rss-parser');
const axios = require('axios');
const prisma = new PrismaClient();
const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['media:content', 'mediaContent'],
    ],
  }
});

const GNEWS_API_KEY = '9f583b61088e9f88fe634c366d3e45e9';

// Fallbacks aleatórios para não ficar igual
const fallbacks = [
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800', // Stadium
  'https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?q=80&w=800', // Football ball
  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=800', // Player
  'https://images.unsplash.com/photo-1518005020252-3b8c5c7069ad?q=80&w=800', // Match
  'https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=800'  // Crowd
];

function getRandomFallback() {
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

async function syncRealNews() {
  console.log('🔄 Iniciando sincronização refinada...');

  try {
    await prisma.noticiaFutebol.deleteMany({});
    const noticiasToInsert = [];

    // 1. Lançamentos de Camisas (Mantos do Futebol)
    console.log('👕 Buscando lançamentos (Mantos)...');
    try {
      const feed = await parser.parseURL('https://mantosdofutebol.com.br/feed');
      
      const mantosNoticias = await Promise.all(feed.items.slice(0, 15).map(async item => {
        let img = null;

        try {
          // Extração robusta
          const pageRes = await axios.get(item.link, { 
            timeout: 8000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36' }
          });
          
          // Ordem de prioridade para OG
          const ogMatch = pageRes.data.match(/property="og:image"\s+content="([^">]+)"/) || 
                          pageRes.data.match(/content="([^">]+)"\s+property="og:image"/) ||
                          pageRes.data.match(/itemprop="image"\s+content="([^">]+)"/);
          
          if (ogMatch) {
            img = ogMatch[1];
          }
          
          // Se ainda não achou, tenta pegar a primeira imagem grande do artigo
          if (!img) {
            const imgMatch = pageRes.data.match(/<img[^>]+src="([^">]+wp-content\/uploads\/[^">]+)"[^>]+class="attachment-post-thumbnail/);
            if (imgMatch) img = imgMatch[1];
          }
        } catch (err) {
          console.warn(`⚠️ Falha em ${item.link}: ${err.message}`);
        }

        return {
          titulo: item.title,
          resumo: item.contentSnippet?.substring(0, 400),
          link: item.link,
          imagem_url: img || getRandomFallback(),
          categoria: 'lancamento',
          fonte: 'Mantos do Futebol',
          data_publicacao: item.pubDate ? new Date(item.pubDate) : new Date()
        };
      }));

      noticiasToInsert.push(...mantosNoticias);
    } catch (e) {
      console.error('❌ Erro Mantos:', e.message);
    }

    // 2. Notícias Gerais (GNews)
    console.log('📰 Buscando GNews...');
    try {
      const response = await axios.get(`https://gnews.io/api/v4/top-headlines?topic=sports&country=br&lang=pt&max=10&apikey=${GNEWS_API_KEY}`);
      if (response.data?.articles) {
        response.data.articles.forEach(article => {
          noticiasToInsert.push({
            titulo: article.title,
            resumo: article.description,
            link: article.url,
            imagem_url: article.image || getRandomFallback(),
            categoria: 'geral',
            fonte: article.source?.name || 'GNews',
            data_publicacao: new Date(article.publishedAt)
          });
        });
      }
    } catch (e) {
      console.error('❌ Erro GNews:', e.message);
    }

    // 3. Jogos e Placares (Mock Ativo)
    const jogosMock = [
      { t1: 'Flamengo', t2: 'Internacional', placar: '1 x 1', status: '82\'', liga: 'Brasileirão' },
      { t1: 'Real Madrid', t2: 'Barcelona', placar: '0 x 0', status: '20\'', liga: 'La Liga' },
      { t1: 'Man. City', t2: 'Chelsea', placar: '3 x 1', status: 'FIM', liga: 'FA Cup' },
      { t1: 'PSG', t2: 'Mônaco', placar: '2 x 0', status: 'Intervalo', liga: 'Ligue 1' }
    ];

    jogosMock.forEach(j => {
      noticiasToInsert.push({
        titulo: `[AO VIVO] ${j.t1} ${j.placar} ${j.t2}`,
        resumo: `Status: ${j.status} - Liga: ${j.liga}. Clique para acompanhar em tempo real no GE.`,
        link: 'https://ge.globo.com/futebol/',
        imagem_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?q=80&w=800',
        categoria: 'resultado',
        fonte: 'Placar Realtime',
        data_publicacao: new Date()
      });
    });

    if (noticiasToInsert.length > 0) {
      await prisma.noticiaFutebol.createMany({ data: noticiasToInsert });
      console.log(`✅ ${noticiasToInsert.length} notícias atualizadas com sucesso!`);
    }

  } catch (err) {
    console.error('❌ Erro global:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

syncRealNews();
