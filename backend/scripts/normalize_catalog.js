/**
 * normalize_catalog.js
 * Limpa o catálogo existente: merge de times duplicados, limpeza de nomes,
 * reatribuição de ligas para itens Retro.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mesma lógica do scraper V4
const TEAM_CONSOLIDATION = {
    'ATLETICO': 'ATLÉTICO MINEIRO', 'ATLÉTICO': 'ATLÉTICO MINEIRO', 'ATLÉTICO-MG': 'ATLÉTICO MINEIRO',
    'ATLETICO MINEIRO': 'ATLÉTICO MINEIRO', 'ATLETICO MG': 'ATLÉTICO MINEIRO',
    'ATHLETICO': 'ATHLETICO PARANAENSE', 'ATHLETICO PR': 'ATHLETICO PARANAENSE',
    'NAUTICO': 'NÁUTICO', 'CLUBE DO REMO': 'REMO', 'SPORTING RECIFE': 'SPORT RECIFE',
    'SAO PAULO': 'SÃO PAULO', 'GREMIO': 'GRÊMIO', 'VITORIA': 'VITÓRIA',
    'CONFIANCA': 'CONFIANÇA', 'CONFIANÇAT': 'CONFIANÇA',
    'CEARA': 'CEARÁ', 'GOIAS': 'GOIÁS', 'AMERICA MG': 'AMÉRICA MINEIRO',
    'BRAZIL': 'BRASIL', 'FRANCE': 'FRANÇA', 'GERMANY': 'ALEMANHA', 'SPAIN': 'ESPANHA',
    'ITALY': 'ITÁLIA', 'ENGLAND': 'INGLATERRA',
    'MAN UNITED': 'MANCHESTER UNITED', 'MAN CITY': 'MANCHESTER CITY',
    'TOTTENHAM': 'TOTTENHAM HOTSPUR', 'SPURS': 'TOTTENHAM HOTSPUR',
    'ATLETICO MADRID': 'ATLÉTICO DE MADRID', 'ATLETICO DE MADRID': 'ATLÉTICO DE MADRID',
    'INTER': 'INTERNAZIONALE', 'INTER MILAN': 'INTERNAZIONALE',
    'AC MILAN': 'MILAN', 'JUVE': 'JUVENTUS'
};

function cleanName(name) {
    let n = name;
    n = n.replace(/\b(S-\d*X*L|S-XXL|SIZE[:\s]*\S*|XS-\d*XL)\b/gi, '').trim();
    n = n.replace(/\b(JERSEY|SHIRT|KIT|FOOTBALL|SOCCER)\b/gi, '').trim();
    n = n.replace(/\s{2,}/g, ' ').trim();
    return n;
}

async function main() {
    console.log('🔧 NORMALIZE CATALOG — Limpeza pós-sync');

    // 1. Limpar nomes de times
    const times = await prisma.time.findMany();
    console.log(`\n📋 ${times.length} times encontrados`);
    
    let merged = 0;
    for (const time of times) {
        const cleanedName = cleanName(time.nome);
        const canonicalName = TEAM_CONSOLIDATION[cleanedName.toUpperCase()] || cleanedName.toUpperCase();
        
        if (canonicalName !== time.nome) {
            const existingCanonical = await prisma.time.findFirst({
                where: { nome: canonicalName, id: { not: time.id } }
            });

            if (existingCanonical) {
                // Mover produtos para o time canônico
                await prisma.produto.updateMany({
                    where: { time_id: time.id },
                    data: { time_id: existingCanonical.id }
                });
                // Deletar time duplicado
                await prisma.time.delete({ where: { id: time.id } });
                console.log(`  🔗 Merged: ${time.nome} → ${canonicalName}`);
                merged++;
            } else {
                // Renomear
                const newSlug = canonicalName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                try {
                    await prisma.time.update({
                        where: { id: time.id },
                        data: { nome: canonicalName, slug: newSlug }
                    });
                    console.log(`  ✏️ Renamed: ${time.nome} → ${canonicalName}`);
                } catch (e) {
                    // Slug já existe, deve ser um merge
                    const target = await prisma.time.findUnique({ where: { slug: newSlug } });
                    if (target) {
                        await prisma.produto.updateMany({
                            where: { time_id: time.id },
                            data: { time_id: target.id }
                        });
                        await prisma.time.delete({ where: { id: time.id } });
                        console.log(`  🔗 Merged (slug conflict): ${time.nome} → ${canonicalName}`);
                        merged++;
                    }
                }
            }
        }
    }

    // 2. Limpar nomes de produtos
    const produtos = await prisma.produto.findMany();
    let prodUpdated = 0;
    for (const prod of produtos) {
        let newName = prod.nome;
        newName = newName.replace(/\b(S-\d*X*L|S-XXL|SIZE[:\s]*\S*)\b/gi, '').trim();
        newName = newName.replace(/\bHome\b/gi, 'Titular');
        newName = newName.replace(/\bAway\b/gi, 'Camisa II');
        newName = newName.replace(/\bThird\b/gi, 'Camisa III');
        newName = newName.replace(/\bGoalkeeper\b/gi, 'Goleiro');
        newName = newName.replace(/\bSpecial Edition\b/gi, 'Edição Especial');
        newName = newName.replace(/\bPlayer Version\b/gi, 'Versão Jogador');
        newName = newName.replace(/\bRetro\b/gi, 'Retrô');
        newName = newName.replace(/\b(Jersey|Shirt|Kit)\b/gi, '').trim();
        newName = newName.replace(/\s{2,}/g, ' ').trim();

        if (newName !== prod.nome) {
            await prisma.produto.update({ where: { id: prod.id }, data: { nome: newName } });
            prodUpdated++;
        }
    }

    console.log(`\n📊 Resumo:`);
    console.log(`   Times merged: ${merged}`);
    console.log(`   Produtos renomeados: ${prodUpdated}`);
    console.log(`   Times restantes: ${await prisma.time.count()}`);
    console.log(`   Produtos restantes: ${await prisma.produto.count()}`);
    
    await prisma.$disconnect();
    process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
