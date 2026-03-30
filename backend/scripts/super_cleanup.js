const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function superCleanup() {
  console.log('--- INICIANDO SUPER FAXINA FINAL ---');

  // 1. Mapa de Consolidação Especial e Troca de Liga
  const SPECIAL_MAP = {
    // Nomes sujos -> Nomes limpos
    '24/25 O\'HIGGINS': 'O\'HIGGINS',
    '25/26 Kids AS Roma': 'ROMA',
    '25/26 Kids Guimarães': 'VITORIA GUIMARAES',
    '25/26 Kids Lens': 'LENS',
    '25/26 LISBON': 'SPORTING CP',
    '25/26 PARIS': 'PSG',
    '25/26 BRAGA': 'BRAGA',
    '25/26 SPORTING': 'SPORTING CP',
    '25/26 LENS': 'LENS',
    '25/26 IWAKA': 'IWAKA',
    '25/26 GUIMARÃES': 'VITORIA GUIMARAES',
    'FAMALICAO 25/26': 'FAMALICÃO',
    'ALVERCA 25/26': 'ALVERCA',
    'BRAGA 25/26': 'BRAGA',
    'TENERIFE 25/26': 'TENERIFE',
    'GRANADA 25/26': 'GRANADA',
    'ELCHE 25/26': 'ELCHE',
    'ELCHE 99/00': 'ELCHE',
    'OSASUNA 25/26': 'OSASUNA',
    'OSASUNA 00/02': 'OSASUNA',
    'MALAGA 25/26': 'MÁLAGA',
    'HÉRCULES 97/98': 'HÉRCULES',
    'PISA 25/26': 'PISA',
    'COMPOSTELA 97/99': 'COMPOSTELA',
    'RETRO PARMA': 'PARMA',
    'RETRO MONACO': 'MONACO',
    'VALLADOLID 92/93': 'REAL VALLADOLID',
    '24/25 WOMEN': 'BRASIL', // Geralmente é seleção feminina
    '24/25 PLAYER': 'EUROPEUS', // Fallback
    'BOLOGNA 97/98': 'BOLOGNA'
  };

  const LEAGUE_MOVES = {
    'BOLOGNA': 61, // Europeus
    'ELCHE': 61,
    'OSASUNA': 61,
    'MÁLAGA': 61,
    'HÉRCULES': 61,
    'COMPOSTELA': 61,
    'TENERIFE': 61,
    'GRANADA': 61,
    'ALVERCA': 61,
    'FAMALICÃO': 61,
    'PARMA': 61,
    'MONACO': 61,
    'LENS': 61,
    'PSG': 61,
    'SPORTING CP': 61,
    'REAL VALLADOLID': 61,
    'ROMA': 61
  };

  const teams = await prisma.time.findMany();

  for (const [dirtyName, cleanName] of Object.entries(SPECIAL_MAP)) {
    const dirtyTeam = teams.find(t => t.nome === dirtyName);
    if (!dirtyTeam) continue;

    console.log(`🧹 Processando: [${dirtyName}] -> [${cleanName}]`);

    // Busca ou cria o time limpo
    let cleanTeam = await prisma.time.findFirst({ where: { nome: cleanName } });

    if (!cleanTeam) {
       console.log(`✨ Criando time canônico: [${cleanName}]`);
       cleanTeam = await prisma.time.create({
         data: {
           nome: cleanName,
           slug: cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-'),
           liga_id: LEAGUE_MOVES[cleanName] || dirtyTeam.liga_id,
           escudo: dirtyTeam.escudo
         }
       });
    }

    // Migra produtos
    const updateResult = await prisma.produto.updateMany({
      where: { time_id: dirtyTeam.id },
      data: { time_id: cleanTeam.id }
    });

    console.log(`📦 Migrados ${updateResult.count} produtos de [${dirtyName}] para [${cleanName}]`);

    // Remove o time sujo
    await prisma.time.delete({ where: { id: dirtyTeam.id } });
  }

  // 2. Corretor de Ligas para nomes específicos que sobraram
  for (const [teamName, newLeagueId] of Object.entries(LEAGUE_MOVES)) {
    const team = await prisma.time.findFirst({ where: { nome: teamName } });
    if (team && team.liga_id !== newLeagueId) {
      console.log(`🌍 Movendo [${teamName}] para liga ID ${newLeagueId}`);
      await prisma.time.update({
        where: { id: team.id },
        data: { liga_id: newLeagueId }
      });
    }
  }

  // 3. Final: Limpar o '25/26 ' fake (ID 4151)
  const fakeTeam = await prisma.time.findUnique({ where: { id: 4151 } });
  if (fakeTeam && fakeTeam.nome.trim() === '25/26') {
     const products = await prisma.produto.findMany({ where: { time_id: 4151 } });
     for (const p of products) {
        // Tenta descobrir o time pelo nome do produto
        let actualTeamName = 'EUROPEUS';
        if (p.nome.includes('Roma')) actualTeamName = 'ROMA';
        else if (p.nome.includes('Guimarães')) actualTeamName = 'VITORIA GUIMARAES';
        else if (p.nome.includes('Lens')) actualTeamName = 'LENS';
        
        let actualTeam = await prisma.time.findFirst({ where: { nome: actualTeamName } });
        if (!actualTeam) {
           actualTeam = await prisma.time.create({ data: { nome: actualTeamName, liga_id: 61 } });
        }
        await prisma.produto.update({ where: { id: p.id }, data: { time_id: actualTeam.id } });
     }
     await prisma.time.delete({ where: { id: 4151 } });
     console.log('🗑️ Removido time fantasma [25/26]');
  }

  console.log('✨ FAXINA CONCLUÍDA!');
}

superCleanup()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
