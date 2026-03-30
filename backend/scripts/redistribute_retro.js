/**
 * redistribute_retro.js
 * Move itens da liga RETRO para as ligas originais dos times.
 * Ex: Valencia na liga RETRO → move para LA LIGA
 *     Flamengo na liga RETRO → move para BRASILEIRÃO
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: [] });

// Mapeamento: nome do time → liga correta
const TEAM_TO_LEAGUE = {
    // Brasileirão
    'FLAMENGO': 'BRASILEIRÃO', 'PALMEIRAS': 'BRASILEIRÃO', 'SÃO PAULO': 'BRASILEIRÃO',
    'CORINTHIANS': 'BRASILEIRÃO', 'SANTOS': 'BRASILEIRÃO', 'GRÊMIO': 'BRASILEIRÃO',
    'BOTAFOGO': 'BRASILEIRÃO', 'ATLÉTICO MINEIRO': 'BRASILEIRÃO', 'FLUMINENSE': 'BRASILEIRÃO',
    'ATHLETICO PARANAENSE': 'BRASILEIRÃO', 'INTERNACIONAL': 'BRASILEIRÃO', 'CRUZEIRO': 'BRASILEIRÃO',
    'VASCO DA GAMA': 'BRASILEIRÃO', 'BAHIA': 'BRASILEIRÃO', 'VITÓRIA': 'BRASILEIRÃO',
    'SPORT RECIFE': 'BRASILEIRÃO', 'FORTALEZA': 'BRASILEIRÃO', 'NÁUTICO': 'BRASILEIRÃO',
    'PAYSANDU': 'BRASILEIRÃO', 'REMO': 'BRASILEIRÃO', 'SANTA CRUZ': 'BRASILEIRÃO',
    'CEARÁ': 'BRASILEIRÃO', 'CUIABÁ': 'BRASILEIRÃO',
    // Premier League
    'ARSENAL': 'PREMIER LEAGUE', 'CHELSEA': 'PREMIER LEAGUE', 'LIVERPOOL': 'PREMIER LEAGUE',
    'MANCHESTER UNITED': 'PREMIER LEAGUE', 'MANCHESTER CITY': 'PREMIER LEAGUE',
    'TOTTENHAM': 'PREMIER LEAGUE', 'TOTTENHAM HOTSPUR': 'PREMIER LEAGUE',
    'EVERTON': 'PREMIER LEAGUE', 'ASTON VILLA': 'PREMIER LEAGUE', 'NEWCASTLE UNITED': 'PREMIER LEAGUE',
    'NEWCASTLE': 'PREMIER LEAGUE', 'WEST HAM': 'PREMIER LEAGUE', 'WOLVERHAMPTON': 'PREMIER LEAGUE',
    'WOLVES': 'PREMIER LEAGUE', 'NOTTINGHAM FOREST': 'PREMIER LEAGUE', 'BRIGHTON': 'PREMIER LEAGUE',
    'CRYSTAL PALACE': 'PREMIER LEAGUE', 'FULHAM': 'PREMIER LEAGUE', 'BOURNEMOUTH': 'PREMIER LEAGUE',
    'BURNLEY': 'PREMIER LEAGUE', 'HULL CITY': 'PREMIER LEAGUE', 'BIRMINGHAM': 'PREMIER LEAGUE',
    'COVENTRY CITY': 'PREMIER LEAGUE', 'CELTIC': 'PREMIER LEAGUE',
    // La Liga
    'REAL MADRID': 'LA LIGA', 'BARCELONA': 'LA LIGA', 'ATLÉTICO DE MADRID': 'LA LIGA',
    'ATLETICO MADRID': 'LA LIGA', 'SEVILLA': 'LA LIGA', 'VALENCIA': 'LA LIGA',
    'VILLARREAL': 'LA LIGA', 'REAL BETIS': 'LA LIGA', 'ATHLETIC BILBAO': 'LA LIGA',
    'REAL SOCIEDAD': 'LA LIGA', 'CELTA DE VIGO': 'LA LIGA', 'MALLORCA': 'LA LIGA',
    'GETAFE': 'LA LIGA', 'OSASUNA': 'LA LIGA', 'RAYO VALLECANO': 'LA LIGA',
    'LAS PALMAS': 'LA LIGA', 'GIRONA': 'LA LIGA', 'DEPORTIVO ALAVÉS': 'LA LIGA',
    'ZARAGOZA': 'LA LIGA', 'REAL OVIEDO': 'LA LIGA', 'MALAGA': 'LA LIGA',
    'COMPOSTELA': 'LA LIGA', 'VALLADOLID': 'LA LIGA', 'SPORTING DE GIJON': 'LA LIGA',
    'ELCHE': 'LA LIGA',
    // Serie A
    'JUVENTUS': 'SERIE A', 'INTER MILAN': 'SERIE A', 'INTERNAZIONALE': 'SERIE A',
    'MILAN': 'SERIE A', 'AC MILAN': 'SERIE A', 'NAPOLI': 'SERIE A', 'ROMA': 'SERIE A',
    'LAZIO': 'SERIE A', 'ATALANTA': 'SERIE A', 'FIORENTINA': 'SERIE A',
    'BOLOGNA': 'SERIE A', 'TORINO': 'SERIE A', 'SASSUOLO': 'SERIE A',
    'SAMPDORIA': 'SERIE A', 'GENOA': 'SERIE A', 'PARMA': 'SERIE A', 'BRESCIA': 'SERIE A',
    // Seleções
    'BRASIL': 'SELEÇÕES', 'BRAZIL': 'SELEÇÕES', 'ARGENTINA': 'SELEÇÕES', 'ALEMANHA': 'SELEÇÕES',
    'GERMAN': 'SELEÇÕES', 'GERMANY': 'SELEÇÕES', 'FRANCE': 'SELEÇÕES', 'FRANÇA': 'SELEÇÕES',
    'ITALY': 'SELEÇÕES', 'ITÁLIA': 'SELEÇÕES', 'ENGLAND': 'SELEÇÕES', 'INGLATERRA': 'SELEÇÕES',
    'SPAIN': 'SELEÇÕES', 'ESPANHA': 'SELEÇÕES', 'PORTUGAL': 'SELEÇÕES',
    'NETHERLANDS': 'SELEÇÕES', 'HOLANDA': 'SELEÇÕES', 'JAPAN': 'SELEÇÕES', 'JAPÃO': 'SELEÇÕES',
    'MEXICO': 'SELEÇÕES', 'MÉXICO': 'SELEÇÕES', 'COLOMBIA': 'SELEÇÕES', 'COLÔMBIA': 'SELEÇÕES',
    'NORWAY': 'SELEÇÕES',
    // Outros (portugues/américa latina)
    'PORTO': 'LA LIGA', 'BENFICA': 'LA LIGA', 'SPORTING LISBON': 'LA LIGA',
    'RIVER PLATE': 'LA LIGA', 'BOCA JUNIORS': 'LA LIGA',
    'GUADALAJARA': 'LA LIGA', 'CRUZ AZUL': 'LA LIGA', 'AMERICA': 'LA LIGA',
    'TIGRES UANL': 'LA LIGA', 'UNIVERSIDAD DE CHILE': 'LA LIGA',
    'NEWELL\'S OLD BOYS': 'LA LIGA', 'ATLÉTICO ROSARIO CEN': 'LA LIGA',
    // Outros europeus
    'FRANKFURT': 'SERIE A', 'WOLFSBURG': 'SERIE A', 'FREIBURG': 'SERIE A',
    'MSV DUISBURG': 'SERIE A', 'BESIKTAS': 'SERIE A', 'OGC NICE': 'SERIE A',
};

async function main() {
    console.log('🔄 REDISTRIBUIÇÃO DE ITENS RETRO');
    console.log('');

    try {
        // Buscar liga RETRO
        const retroLigas = await prisma.$queryRawUnsafe(`SELECT id FROM ligas WHERE nome = 'RETRO' LIMIT 1`);
        if (retroLigas.length === 0) { console.log('❌ Liga RETRO não encontrada'); process.exit(0); }
        const retroId = retroLigas[0].id;

        // Buscar times na liga RETRO
        const retroTimes = await prisma.$queryRawUnsafe(`SELECT id, nome FROM times WHERE liga_id = ${retroId}`);
        console.log(`📋 ${retroTimes.length} times encontrados na liga RETRO`);

        let moved = 0;
        let kept = 0;

        for (const time of retroTimes) {
            const targetLeague = TEAM_TO_LEAGUE[time.nome.toUpperCase()];
            
            if (targetLeague) {
                // Encontrar a liga de destino
                const destLigas = await prisma.$queryRawUnsafe(`SELECT id FROM ligas WHERE nome = '${targetLeague}' LIMIT 1`);
                
                if (destLigas.length > 0) {
                    const destLigaId = destLigas[0].id;
                    
                    // Verificar se já existe um time com o mesmo slug na liga de destino
                    const existingTeam = await prisma.$queryRawUnsafe(
                        `SELECT id FROM times WHERE liga_id = ${destLigaId} AND nome = '${time.nome.replace(/'/g, "''")}' AND id != ${time.id} LIMIT 1`
                    );
                    
                    if (existingTeam.length > 0) {
                        // Merge: mover produtos para o time existente
                        await prisma.$executeRawUnsafe(`UPDATE produtos SET time_id = ${existingTeam[0].id} WHERE time_id = ${time.id}`);
                        await prisma.$executeRawUnsafe(`DELETE FROM times WHERE id = ${time.id}`);
                        console.log(`   🔗 Merged: ${time.nome} → ${targetLeague} (junto ao time existente)`);
                    } else {
                        // Reatribuir liga
                        await prisma.$executeRawUnsafe(`UPDATE times SET liga_id = ${destLigaId} WHERE id = ${time.id}`);
                        console.log(`   ✅ Movido: ${time.nome} → ${targetLeague}`);
                    }
                    moved++;
                } else {
                    console.log(`   ⚠️ Liga ${targetLeague} não existe no DB, mantendo ${time.nome} em RETRO`);
                    kept++;
                }
            } else {
                console.log(`   ℹ️ Mantido em RETRO: ${time.nome}`);
                kept++;
            }
        }

        // Verificar se a liga RETRO ficou vazia
        const remaining = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as c FROM times WHERE liga_id = ${retroId}`);
        const retCount = Number(remaining[0].c);

        if (retCount === 0) {
            // Deletar liga e categoria RETRO se vazias
            await prisma.$executeRawUnsafe(`DELETE FROM ligas WHERE id = ${retroId}`);
            console.log('\n🗑️ Liga RETRO removida (ficou vazia)');
        }

        console.log(`\n📊 Resumo:`);
        console.log(`   Movidos: ${moved}`);
        console.log(`   Mantidos em RETRO: ${kept}`);
        console.log(`   Restantes em RETRO: ${retCount}`);

    } catch (err) {
        console.error('❌ Erro:', err.message);
    }

    await prisma.$disconnect();
    process.exit(0);
}

main();
