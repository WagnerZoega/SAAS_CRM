const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const CONSOLIDATION_MAP = {
    // Premier League / English
    'BIRMINGHAM 19/20': 'BIRMINGHAM CITY',
    'BIRMINGHAM 02/03': 'BIRMINGHAM CITY',
    'BIRMINGHAM 96/97': 'BIRMINGHAM CITY',
    'M-U WINDBREAKER': 'MANCHESTER UNITED',
    'M-U RETRO': 'MANCHESTER UNITED',
    'M-U JACKET': 'MANCHESTER UNITED',
    'M-U REVERSIBLE': 'MANCHESTER UNITED',
    'M-U 06/07': 'MANCHESTER UNITED',
    'M-U 1819': 'MANCHESTER UNITED',
    'M-U 20/21': 'MANCHESTER UNITED',
    'M-U 99/00': 'MANCHESTER UNITED',
    'M-U 92/94': 'MANCHESTER UNITED',
    'SUNDERLAND 25/26': 'SUNDERLAND',
    'SOUTHAMPTON 26/27': 'SOUTHAMPTON',
    'BRIGHTON 25/26': 'BRIGHTON',
    'WEST HAM': 'WEST HAM UNITED',
    'TOTTENHAM': 'TOTTENHAM HOTSPUR',
    'WOLVES 86/87': 'WOLVERHAMPTON',

    // Europeus / International
    '24/25 MARSEILLE': 'MARSEILLE',
    'MARSEILLE 99/00': 'MARSEILLE',
    'MARSEILLE 11/12': 'MARSEILLE',
    'RETRO MARSEILLE': 'MARSEILLE',
    '24/25 LILLE': 'LILLE',
    'LILLE 95/96': 'LILLE',
    'NAPOLI 25/26': 'NAPOLI',
    'NAPOLI 89/90': 'NAPOLI',
    'NAPOLI 1989': 'NAPOLI',
    'ROMA 06/07': 'ROMA',
    'ROMA 25/26': 'ROMA',
    'ROMA 99/00': 'ROMA',
    'ROMA REVERSIBLE': 'ROMA',
    'SEVILLA 25/26': 'SEVILLA',
    'SEVILLA REVERSIBLE': 'SEVILLA',
    'SEVILLA WINDBREAKER': 'SEVILLA',
    'VILLARREAL 08/09': 'VILLARREAL',
    'VALENCIA 00/01': 'VALENCIA',
    'VALENCIA 25/26': 'VALENCIA',
    'ZARAGOZA 99/00': 'ZARAGOZA',
    'ZARAGOZA 25/26': 'ZARAGOZA',
    'MONACO 25/26': 'MONACO',
    '25/26 MONACO': 'MONACO',
    'LAZIO 25/26': 'LAZIO',
    'LAZIO 99/00': 'LAZIO',
    'SAMPDORIA 84/88': 'SAMPDORIA',
    'SAMPDORIA 03/04': 'SAMPDORIA',
    'SAMPDORIA 00/01': 'SAMPDORIA',
    'FIORENTINA 97/98': 'FIORENTINA',
    'FIORENTINA 7980': 'FIORENTINA',
    'ATALANTA 25/26': 'ATALANTA',
    'SASSUOLO 25/26': 'SASSUOLO',
    'TORINO 25/26': 'TORINO',
    'GENOA 25/26': 'GENOA',
    'VENEZIA 25/26': 'VENEZIA',
    'BOLOGNA 97/98': 'BOLOGNA',
    '24/25 BOLOGNA': 'BOLOGNA',
    'RETRO OLYMPIQUE': 'OLYMPIQUE LYONNAIS',
    '25/26 OLYMPIQUE': 'OLYMPIQUE LYONNAIS',
    'OLYMPIQUE DE': 'OLYMPIQUE LYONNAIS',

    // Brasileiro
    '21/22 MINEIRO': 'ATLÉTICO MINEIRO',
    'ATLÉTICO 25/26': 'ATLÉTICO MINEIRO',
    '23/24 RECIFE': 'SPORT RECIFE',
    'VITÓRIA 25/26': 'VITÓRIA',
    'VITÓRIA 1993': 'VITÓRIA',
    'CONFIANÇA 24/25': 'CONFIANÇA',
    'CONFIANÇAT 24/26': 'CONFIANÇA',
    'CUIABÁ 24/25': 'CUIABÁ',
    '24/25 O\'HIGGINS': 'O\'HIGGINS',
    'ATLETICO PARANAENSE': 'ATLÉTICO PARANAENSE'
};

async function consolidate() {
    console.log('🚀 INICIANDO CONSOLIDAÇÃO GLOBAL DE TIMES 🚀');

    for (const [dirtyName, cleanName] of Object.entries(CONSOLIDATION_MAP)) {
        const dirtyTeam = await prisma.time.findFirst({ where: { nome: dirtyName } });
        if (!dirtyTeam) continue;

        let cleanTeam = await prisma.time.findFirst({ where: { nome: cleanName } });
        
        // Se não existir o time limpo, renomear o sujo (caso ele seja o único)
        if (!cleanTeam) {
            console.log(`📝 Renomeando [${dirtyName}] para [${cleanName}]...`);
            const cleanSlug = cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-0]/g, '-');
            await prisma.time.update({
                where: { id: dirtyTeam.id },
                data: { nome: cleanName, slug: cleanSlug }
            });
            continue;
        }

        console.log(`🔄 Migrando [${dirtyName}] (${dirtyTeam.id}) -> [${cleanName}] (${cleanTeam.id})...`);

        // Mover produtos
        await prisma.produto.updateMany({
            where: { time_id: dirtyTeam.id },
            data: { time_id: cleanTeam.id }
        });

        // Mover Slugs (se houver algum especifico para o time que precise ser alterado, mas geralmente slugs de produtos apontam para product ID)
        
        // Deletar o time sujo
        try {
            await prisma.time.delete({ where: { id: dirtyTeam.id } });
            console.log(`✅ Sucesso.`);
        } catch (e) {
            console.log(`⚠️ Erro ao deletar (provavelmente relações restantes): ${e.message}`);
        }
    }

    console.log('\n✨ CONSOLIDAÇÃO CONCLUÍDA!');
    const finalCount = await prisma.time.count();
    console.log(`Times restantes: ${finalCount}`);
    process.exit(0);
}

consolidate().catch(e => { console.error(e); process.exit(1); });
