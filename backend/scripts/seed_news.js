const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedNews() {
  console.log('Inserting test soccer news...');
  
  await prisma.noticiaFutebol.createMany({
    data: [
      {
        titulo: 'Vazamento: Nova Camisa do Flamengo 24/25 Home',
        resumo: 'Imagens revelam detalhes do novo manto sagrado...',
        link: 'https://mantosdofutebol.com.br/exemplo-flamengo',
        imagem_url: 'https://images.yupoo.com/example/flamengo_leak.jpg',
        categoria: 'lancamento',
        fonte: 'Mantos do Futebol',
        data_publicacao: new Date()
      },
      {
        titulo: 'Real Madrid vence clássico e amplia liderança',
        resumo: 'Com gols de Vini Jr, Madrid domina o jogo...',
        link: 'https://ge.globo.com/futebol/exemplo-real',
        imagem_url: 'https://s2-ge.glbimg.com/example/real_madrid.jpg',
        categoria: 'geral',
        fonte: 'Globo Esporte',
        data_publicacao: new Date()
      },
      {
        titulo: 'Manchester City vs Arsenal: Placar ao Vivo',
        resumo: 'Acompanhe todos os lances do jogão...',
        link: 'https://api-futebol.com.br/jogos/exemplo',
        imagem_url: 'https://images.yupoo.com/example/city_vs_arsenal.jpg',
        categoria: 'resultado',
        fonte: 'API Futebol',
        data_publicacao: new Date()
      }
    ]
  });

  console.log('✅ Test news inserted!');
}

seedNews()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
