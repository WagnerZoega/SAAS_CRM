/**
 * deep_clean.js
 * Limpeza profunda: merge de times com sufixos, entidades HTML, nomes duplicados
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function cleanHTML(str) {
    return str
        .replace(/\&#[xX]27;/g, "'")
        .replace(/\&amp;/g, '&')
        .replace(/\&lt;/g, '<')
        .replace(/\&gt;/g, '>')
        .replace(/\&quot;/g, '"')
        .replace(/&#(\d+);/g, (m, c) => String.fromCharCode(c));
}

function cleanTeamNameDeep(name) {
    let n = cleanHTML(name).toUpperCase().trim();
    
    // Remover sufixos comuns que criam fragmentação
    n = n.replace(/\s*'S\s*(CROP TOP STYLE)?/gi, '').trim();
    n = n.replace(/\bCROP TOP STYLE\b/gi, '').trim();
    n = n.replace(/\bLONG[-\s]?SLEEVE[D]?\b/gi, '').trim();
    n = n.replace(/\bVEST\b/gi, '').trim();
    n = n.replace(/\bSHORTS?\b/gi, '').trim();
    n = n.replace(/\bPOLO\b/gi, '').trim();
    n = n.replace(/\bSUIT\b/gi, '').trim();
    n = n.replace(/\bJACKET\b/gi, '').trim();
    n = n.replace(/\bWINDBREAKER\b/gi, '').trim();
    n = n.replace(/\bREVERSIBLE\b/gi, '').trim();
    n = n.replace(/\bTERRACE ICONS T-?\s*\w*/gi, '').trim();
    n = n.replace(/\bALL SPONSOR(S|ED)?\b/gi, '').trim();
    n = n.replace(/\bSECOND\b/gi, '').trim();
    n = n.replace(/\bLIFESTYLER\b/gi, '').trim();
    n = n.replace(/\bAMERICAN\b/gi, '').trim();
    
    // Remover cores e detalhes
    n = n.replace(/\s*-\s*(RED|BLUE|BLACK|WHITE|BROWN|YELLOW|GREEN|PINK|GREY|PURPLE|GOLD|BEIGE|APRICOT|DARK BLUE|CYAN)\b/gi, '').trim();
    
    // Remover tamanhos
    n = n.replace(/\b(S-\d*X*L|S-XXL|SIZE[:\s]*\S*|XS-\d*XL|S---XXL)\b/gi, '').trim();
    
    // Remover temporadas
    n = n.replace(/\b\d{2,4}[-\/]\d{2,4}\b/g, '').trim();
    n = n.replace(/\b(19|20)\d{2}\b/g, '').trim();
    
    // Remover palavras de produto
    n = n.replace(/\b(JERSEY|SHIRT|KIT|FOOTBALL|SOCCER|HOME|AWAY|THIRD|GOALKEEPER|GK|TRAINING|RETRO|VINTAGE|SPECIAL|EDITION|PLAYER|VERSION|PRE-?MATCH|COMMEMORATIVE|DIAMOND|AVENGERS|OASIS BAND)\b/gi, '').trim();
    n = n.replace(/\b(WOMEN'?S?|KIDS?|MENS?|INFANTIL|FEMININA)\b/gi, '').trim();
    
    // Remover # e números soltos
    n = n.replace(/#\d+/g, '').trim();
    
    // Limpar hifens e espaços soltos
    n = n.replace(/\s*[-–]\s*$/g, '').replace(/^\s*[-–]\s*/g, '').trim();
    n = n.replace(/\s{2,}/g, ' ').trim();
    
    return n;
}

function cleanProductName(name) {
    let n = cleanHTML(name);
    
    // Remover repetições (Camisa III Camisa II)
    n = n.replace(/\b(Camisa\s+(II|III))\s+(Camisa\s+(II|III))/gi, '$1');
    
    // Limpar entidades HTML
    n = n.replace(/\s{2,}/g, ' ').trim();
    
    return n;
}

async function main() {
    console.log('🧹 DEEP CLEAN — Limpeza Profunda do Catálogo');
    console.log('');
    
    // ═══════════ FASE 1: Limpar nomes de produtos ═══════════
    console.log('📋 Fase 1: Limpando nomes de produtos...');
    const produtos = await prisma.produto.findMany();
    let prodFixed = 0;
    for (const prod of produtos) {
        const newName = cleanProductName(prod.nome);
        if (newName !== prod.nome) {
            await prisma.produto.update({ where: { id: prod.id }, data: { nome: newName } });
            prodFixed++;
        }
    }
    console.log(`   ✅ ${prodFixed} produtos renomeados`);
    
    // ═══════════ FASE 2: Consolidar times ═══════════
    console.log('\n📋 Fase 2: Consolidando times duplicados...');
    const times = await prisma.time.findMany({ orderBy: { id: 'asc' } });
    const teamMap = {}; // cleanName → canonical time record
    let merged = 0;
    
    for (const time of times) {
        const cleanName = cleanTeamNameDeep(time.nome);
        if (!cleanName || cleanName.length < 2) continue;
        
        if (teamMap[cleanName]) {
            // Já existe um time canônico -> merge
            const canonical = teamMap[cleanName];
            const prodCount = await prisma.produto.count({ where: { time_id: time.id } });
            
            if (prodCount > 0) {
                await prisma.produto.updateMany({
                    where: { time_id: time.id },
                    data: { time_id: canonical.id }
                });
            }
            
            // Mover preços
            const precoCount = await prisma.precoEmpresa.count({ where: { produto: { time_id: time.id } } });
            
            try {
                await prisma.time.delete({ where: { id: time.id } });
                console.log(`   🔗 Merged: "${time.nome}" → "${canonical.nome}" (${prodCount} prods)`);
                merged++;
            } catch (e) {
                console.log(`   ⚠️ Não conseguiu deletar: "${time.nome}" (${e.message.substring(0, 50)})`);
            }
        } else {
            // Renomear o time para a versão limpa se necessário
            if (cleanName !== time.nome.toUpperCase()) {
                const newSlug = cleanName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
                try {
                    await prisma.time.update({
                        where: { id: time.id },
                        data: { nome: cleanName, slug: newSlug }
                    });
                    console.log(`   ✏️ Renamed: "${time.nome}" → "${cleanName}"`);
                } catch (e) {
                    // Slug já existe - merge
                    const existing = await prisma.time.findUnique({ where: { slug: newSlug } });
                    if (existing && existing.id !== time.id) {
                        await prisma.produto.updateMany({
                            where: { time_id: time.id },
                            data: { time_id: existing.id }
                        });
                        try {
                            await prisma.time.delete({ where: { id: time.id } });
                            console.log(`   🔗 Merged (slug): "${time.nome}" → "${existing.nome}"`);
                            merged++;
                            teamMap[cleanName] = existing;
                            continue;
                        } catch (e2) {}
                    }
                }
            }
            teamMap[cleanName] = time;
        }
    }
    
    // ═══════════ RESUMO ═══════════
    const finalTimes = await prisma.time.count();
    const finalProds = await prisma.produto.count();
    
    console.log(`\n═══════════════════════════════════════`);
    console.log(`📊 Resumo Final:`);
    console.log(`   Produtos renomeados: ${prodFixed}`);
    console.log(`   Times consolidados: ${merged}`);
    console.log(`   Times restantes: ${finalTimes}`);
    console.log(`   Produtos restantes: ${finalProds}`);
    console.log(`═══════════════════════════════════════`);
    
    await prisma.$disconnect();
    process.exit(0);
}

main().catch(err => { console.error(err); process.exit(1); });
