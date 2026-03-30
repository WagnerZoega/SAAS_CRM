const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const sharp = require('sharp');
const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// ESTRATÉGIA V5: Entrar em CADA TIME individualmente
// Regra de foto: 2ª e 3ª (90% dos casos) | Fallback: 2 últimas
// ═══════════════════════════════════════════════════════════════

// Brasileirão - Cada time com sua subcategoria
const BRASILEIRAO_TEAMS = [
    { team: 'Flamengo', url: 'https://minkang.x.yupoo.com/categories/720314?isSubCate=true' },
    { team: 'Palmeiras', url: 'https://minkang.x.yupoo.com/categories/720315?isSubCate=true' },
    { team: 'Sao Paulo', url: 'https://minkang.x.yupoo.com/categories/720316?isSubCate=true' },
    { team: 'Corinthians', url: 'https://minkang.x.yupoo.com/categories/720317?isSubCate=true' },
    { team: 'Santos', url: 'https://minkang.x.yupoo.com/categories/720318?isSubCate=true' },
    { team: 'Athletico Paranaense', url: 'https://minkang.x.yupoo.com/categories/720322?isSubCate=true' },
    { team: 'Internacional', url: 'https://minkang.x.yupoo.com/categories/720319?isSubCate=true' },
    { team: 'Gremio', url: 'https://minkang.x.yupoo.com/categories/720320?isSubCate=true' },
    { team: 'Fluminense', url: 'https://minkang.x.yupoo.com/categories/720321?isSubCate=true' },
    { team: 'Vasco', url: 'https://minkang.x.yupoo.com/categories/720323?isSubCate=true' },
    { team: 'Botafogo', url: 'https://minkang.x.yupoo.com/categories/720324?isSubCate=true' },
    { team: 'Cruzeiro', url: 'https://minkang.x.yupoo.com/categories/720325?isSubCate=true' },
    { team: 'Atletico Mineiro', url: 'https://minkang.x.yupoo.com/categories/720326?isSubCate=true' },
    { team: 'Bahia', url: 'https://minkang.x.yupoo.com/categories/720327?isSubCate=true' },
    { team: 'Fortaleza', url: 'https://minkang.x.yupoo.com/categories/720328?isSubCate=true' },
    { team: 'Coritiba', url: 'https://minkang.x.yupoo.com/categories/720329?isSubCate=true' },
    { team: 'Cuiaba', url: 'https://minkang.x.yupoo.com/categories/720330?isSubCate=true' },
    { team: 'Goias', url: 'https://minkang.x.yupoo.com/categories/720331?isSubCate=true' },
    { team: 'Bragantino', url: 'https://minkang.x.yupoo.com/categories/720333?isSubCate=true' }
];

const OTHER_CATEGORIES = [
    { name: 'RETRO', url: 'https://minkang.x.yupoo.com/categories/711624', liga: 'RETRO' },
    { name: 'PREMIER LEAGUE', url: 'https://minkang.x.yupoo.com/categories/680720', liga: 'PREMIER LEAGUE' },
    { name: 'LA LIGA', url: 'https://minkang.x.yupoo.com/categories/680717', liga: 'LA LIGA' },
    { name: 'SERIE A', url: 'https://minkang.x.yupoo.com/categories/680719', liga: 'SERIE A' },
    { name: 'BUNDESLIGA', url: 'https://minkang.x.yupoo.com/categories/680718', liga: 'BUNDESLIGA' },
    { name: 'LIGUE 1', url: 'https://minkang.x.yupoo.com/categories/680721', liga: 'LIGUE 1' }
];

// ═══════════════════════════════════════════════════════════════
// TRADUÇÃO PT-BR
// ═══════════════════════════════════════════════════════════════
function translateName(raw) {
    let n = raw;
    // HTML entities
    n = n.replace(/&#[xX]27;/g, "'").replace(/&amp;/g, '&');
    // Tamanhos
    n = n.replace(/\b(S-\d*X*L|S-XXL|S---XXL|SIZE[:\s]*\S*|XS-\d*XL)\b/gi, '');
    // Traduções
    n = n.replace(/\bHome\b/gi, 'Titular');
    n = n.replace(/\bAway\b/gi, 'Camisa II');
    n = n.replace(/\bThird\b/gi, 'Camisa III');
    n = n.replace(/\bGoalkeeper\b/gi, 'Goleiro');
    n = n.replace(/\bGK\b/gi, 'Goleiro');
    n = n.replace(/\bSpecial Edition\b/gi, 'Edição Especial');
    n = n.replace(/\bPlayer Version\b/gi, 'Versão Jogador');
    n = n.replace(/\bTraining\b/gi, 'Treino');
    n = n.replace(/\bPre[- ]?Match\b/gi, 'Pré-Jogo');
    n = n.replace(/\bRetro\b/gi, 'Retrô');
    n = n.replace(/\bLong Sleeve[d]?\b/gi, 'Manga Longa');
    n = n.replace(/\bWomen'?s?\b/gi, 'Feminina');
    n = n.replace(/\bKids?\b/gi, 'Infantil');
    // Remover sujeira
    n = n.replace(/\b(Jersey|Shirt|Kit|Football|Soccer)\b/gi, '');
    n = n.replace(/\s{2,}/g, ' ').trim();
    n = n.replace(/\s*[-–]\s*$/, '').trim();
    return n;
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES DE REDE E FOTOS V5.3
// ═══════════════════════════════════════════════════════════════

function getSaturation(r, g, b) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    return max === 0 ? 0 : d / max;
}

async function getHTML(url) {
    try {
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 15000
        });
        return res.data;
    } catch (err) { return null; }
}

async function analyzePhoto(url) {
    try {
        const res = await axios.get(url, { 
            responseType: 'arraybuffer', 
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': 'https://minkang.x.yupoo.com/' }
        });
        const img = sharp(Buffer.from(res.data));
        const { width, height } = await img.metadata();
        
        // V5.6: Filtro de Proporção Rigoroso (Vertical Profissional)
        const aspectRatio = width / height;
        if (aspectRatio > 0.9 || aspectRatio < 0.6) return { isFullShot: false, hash: 0, contourHash: 0, url };

        // V5.6: Auditoria de Pureza das Bordas (Detecção de Espaço Vazio)
        // Se houver "detalhe" ou cor de tecido nas bordas, é um ZOOM.
        const marginH = Math.floor(width * 0.15); // 15% de margem lateral
        const marginV = Math.floor(height * 0.10); // 10% de margem vertical
        
        // Amostras das bordas (Superior, Esquerda, Direita)
        const edgeStats = [
            await img.clone().extract({ left: 0, top: 0, width: width, height: marginV }).stats(), // Topo
            await img.clone().extract({ left: 0, top: marginV, width: marginH, height: height - marginV * 2 }).stats(), // Lateral Esq
            await img.clone().extract({ left: width - marginH, top: marginV, width: marginH, height: height - marginV * 2 }).stats() // Lateral Dir
        ];

        // Se a variância nas bordas for alta, significa que há tecido/detalhe encostando no limite -> ZOOM
        const edgeVariance = (edgeStats[0].channels[0].stdev + edgeStats[1].channels[0].stdev + edgeStats[2].channels[0].stdev) / 3;
        if (edgeVariance > 15) return { isFullShot: false, hash: 0, contourHash: 0, url }; // Arredores devem ser "mortos" (fundo)

        // V5.3: Uniformidade + Contraste + Saturação
        const cs = 12;
        const positions = [[0, 0], [width - cs, 0], [0, height - cs], [width - cs, height - cs]];
        let corners = [];
        for (const [l, t] of positions) {
            const st = await img.clone().extract({ left: l, top: t, width: cs, height: cs }).stats();
            corners.push({ r: st.channels[0].mean, g: st.channels[1].mean, b: st.channels[2].mean });
        }
        
        let maxDiff = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = i + 1; j < 4; j++) {
                const d = Math.sqrt(Math.pow(corners[i].r - corners[j].r, 2) + Math.pow(corners[i].g - corners[j].g, 2) + Math.pow(corners[i].b - corners[j].b, 2));
                if (d > maxDiff) maxDiff = d;
            }
        }

        const cx = Math.max(0, Math.floor(width/2) - 25), cy = Math.max(0, Math.floor(height/2) - 25);
        const centerStats = await img.clone().extract({ left: cx, top: cy, width: 50, height: 50 }).stats();
        const center = { r: centerStats.channels[0].mean, g: centerStats.channels[1].mean, b: centerStats.channels[2].mean };
        
        const avgCorner = {
            r: (corners[0].r + corners[1].r + corners[2].r + corners[3].r) / 4,
            g: (corners[0].g + corners[1].g + corners[2].g + corners[3].g) / 4,
            b: (corners[0].b + corners[1].b + corners[2].b + corners[3].b) / 4
        };
        
        const contrast = Math.sqrt(Math.pow(center.r - avgCorner.r, 2) + Math.pow(center.g - avgCorner.g, 2) + Math.pow(center.b - avgCorner.b, 2));
        const saturation = getSaturation(avgCorner.r, avgCorner.g, avgCorner.b);

        // V5.6 Final Logic:
        // 1. Fundo limpo (maxDiff < 45)
        // 2. Contraste Real (contrast > 45) -> Garante objeto central sólido
        // 3. Sem cor vibrante no fundo (saturation < 0.25) -> Purifica o estúdio
        const isFullShot = maxDiff < 45 && contrast > 45 && saturation < 0.25;
        const hash = Math.round(center.r * 10000 + center.g * 100 + center.b);

        // V5.4: Hash do Contorno (Top/Bottom similarity)
        const contourWidth = 20;
        const topContour = await img.clone().extract({ left: 0, top: 0, width: width, height: contourWidth }).stats();
        const bottomContour = await img.clone().extract({ left: 0, top: height - contourWidth, width: width, height: contourWidth }).stats();
        const contourHash = Math.round(
            topContour.channels[0].mean * 1000 + 
            bottomContour.channels[0].mean * 100 + 
            topContour.channels[1].mean * 10 + 
            bottomContour.channels[1].mean
        );

        return { isFullShot, hash, contourHash, url, width, height };
    } catch { return { isFullShot: false, hash: 0, contourHash: 0, url }; }
}

async function getFrontBackPhotos(albumUrl) {
    const html = await getHTML(albumUrl);
    if (!html) return [];
    
    const regex = /https:\/\/photo\.yupoo\.com\/[^\/]+\/[^\/]+\/[^"'\s<>]+(?:\.jpg|\.jpeg|\.png)/gi;
    const matches = html.match(regex) || [];
    const unique = [...new Set(matches.map(img => img.split('?')[0]))].filter(img => {
        const l = img.toLowerCase();
        return !l.includes('icon') && !l.includes('logo') && !l.includes('square') && !l.includes('small') && !l.includes('medium');
    });
    
    if (unique.length === 0) return [];
    if (unique.length <= 2) return unique.slice(0, 2);

    // V5.5: Estratégia de Exaustão de Pares Padrão ([0,1], [1,2] e os 2 últimos)
    // Isso garante capturar as versões "LIMPAS" que o Minkang coloca no início de álbuns novos
    const potentialPairs = [
        [unique[0], unique[1]],
        [unique[1], unique[2]],
        [unique[unique.length - 2], unique[unique.length - 1]]
    ];

    for (const pair of potentialPairs) {
        if (!pair[0] || !pair[1]) continue;
        const analyzed = [await analyzePhoto(pair[0]), await analyzePhoto(pair[1])];
        if (analyzed[0].isFullShot && analyzed[1].isFullShot) {
            const contourDiff = Math.abs(analyzed[0].contourHash - analyzed[1].contourHash);
            const colorDiff = Math.abs(analyzed[0].hash - analyzed[1].hash);
            // Contorno quase idêntico (mesma peça) + cores diferentes (Frente vs Verso)
            if (contourDiff < 600 && colorDiff > 150 && colorDiff < 18000) {
                return [analyzed[0].url, analyzed[1].url];
            }
        }
    }
    
    // Fallback: Estratégia de Score Global em todas para casos complexos
    const analyzed = [];
    for (const url of unique) {
        const res = await analyzePhoto(url);
        if (res.isFullShot) analyzed.push(res);
    }
    
    if (analyzed.length < 2) {
        return unique.length > 2 ? [unique[1], unique[unique.length - 2]] : [unique[0], unique[unique.length - 1]];
    }
    
    let bestA, bestB, maxScore = -1;
    for (let i = 0; i < analyzed.length; i++) {
        for (let j = i + 1; j < analyzed.length; j++) {
            const colorDiff = Math.abs(analyzed[i].hash - analyzed[j].hash);
            const contourDiff = Math.abs(analyzed[i].contourHash - analyzed[j].contourHash);
            const posFactor = (i + j) / (analyzed.length * 2);
            
            // Penalidade de contorno (mesmo vestuário check)
            const contourPenalty = contourDiff > 1000 ? 0.2 : 
                                   contourDiff > 500 ? 0.6 : 1.0;
            
            const score = colorDiff * (1 + posFactor) * contourPenalty;
            
            if (score > maxScore) {
                maxScore = score;
                bestA = analyzed[i];
                bestB = analyzed[j];
            }
        }
    }

    return [bestA.url, bestB.url];
}

// ═══════════════════════════════════════════════════════════════
// PROCESSAMENTO DE ÁLBUNS
// ═══════════════════════════════════════════════════════════════
async function processAlbum(albumUrl, teamName, ligaNome, teamSlug, dbTime) {
    const html = await getHTML(albumUrl);
    if (!html) return false;
    
    // Extrair título
    let title = 'Produto';
    const m = html.match(/data-name="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
    if (m) title = m[1].split('|')[0].trim();
    
    // Traduzir o nome
    const productName = translateName(title);
    
    // Fotos frente/verso
    const photos = await getFrontBackPhotos(albumUrl);
    if (photos.length === 0) return false;
    
    // Slug do produto
    const slug = (productName + '-' + teamName)
        .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 190);
    
    await prisma.produto.upsert({
        where: { slug },
        update: { nome: productName, foto_principal: photos[0], fotos: photos, time_id: dbTime.id, url_yupoo: albumUrl, ativo: true },
        create: { nome: productName, slug, time_id: dbTime.id, foto_principal: photos[0], fotos: photos, preco_custo: 50.00, url_yupoo: albumUrl, ativo: true }
    });
    
    return true;
}

async function getAllAlbumsFromPage(url) {
    let allAlbums = [];
    let currentUrl = url;
    let page = 1;
    
    while (currentUrl) {
        const html = await getHTML(currentUrl);
        if (!html) break;
        
        const found = html.match(/\/albums\/(\d+)\?uid=1/g) || [];
        const unique = [...new Set(found)].map(l => `https://minkang.x.yupoo.com${l}`);
        allAlbums.push(...unique);
        
        // Próxima página
        const next = html.match(/href="([^"]+)"[^>]*class="pagination__next"/);
        if (next) {
            currentUrl = `https://minkang.x.yupoo.com${next[1]}`;
            page++;
        } else {
            currentUrl = null;
        }
    }
    
    return [...new Set(allAlbums)];
}

// ═══════════════════════════════════════════════════════════════
// SCRAPE BRASILEIRÃO (Time por time)
// ═══════════════════════════════════════════════════════════════
async function scrapeBrasileirao() {
    console.log('\n🇧🇷 ═══ BRASILEIRÃO — Time por Time ═══');
    
    const catSlug = 'brasileirao';
    const dbCat = await prisma.categoria.upsert({
        where: { slug: catSlug },
        update: { nome: 'BRASILEIRÃO' },
        create: { nome: 'BRASILEIRÃO', slug: catSlug }
    });
    const dbLiga = await prisma.liga.findFirst({ where: { nome: 'BRASILEIRÃO' } }) ||
                   await prisma.liga.create({ data: { nome: 'BRASILEIRÃO', categoria_id: dbCat.id } });
    
    for (const t of BRASILEIRAO_TEAMS) {
        console.log(`\n⚽ ${t.team}`);
        
        const teamSlug = t.team.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        const dbTime = await prisma.time.upsert({
            where: { slug: teamSlug },
            update: { nome: t.team },
            create: { nome: t.team, slug: teamSlug, liga_id: dbLiga.id }
        });
        
        const albums = await getAllAlbumsFromPage(t.url);
        console.log(`   📦 ${albums.length} modelos encontrados`);
        
        let ok = 0;
        for (let i = 0; i < albums.length; i++) {
            process.stdout.write(`   [${i+1}/${albums.length}] `);
            const success = await processAlbum(albums[i], t.team, 'BRASILEIRÃO', teamSlug, dbTime);
            console.log(success ? '✅' : '❌');
            if (success) ok++;
        }
        console.log(`   ✔ ${ok}/${albums.length} importados`);
    }
}

// ═══════════════════════════════════════════════════════════════
// SCRAPE OUTRAS LIGAS (página geral)
// ═══════════════════════════════════════════════════════════════
function extractTeamFromTitle(title) {
    let name = title.toUpperCase();
    // Limpar sujeira para extrair apenas o time
    name = name.replace(/\b(S-\d*X*L|S-XXL|SIZE[:\s]*\S*)\b/gi, '');
    name = name.replace(/\b\d{2,4}[-\/]\d{2,4}\b/g, '');
    name = name.replace(/\b(19|20)\d{2}\b/g, '');
    name = name.replace(/\b(JERSEY|SHIRT|KIT|HOME|AWAY|THIRD|GOALKEEPER|GK|TRAINING|RETRO|VINTAGE|SPECIAL|EDITION|PLAYER|VERSION|PRE-?MATCH|LONG SLEEVE[D]?|SHORT SLEEVE|WOMEN'?S?|KIDS?|MENS?)\b/gi, '');
    name = name.replace(/&#[xX]27;/g, "'").replace(/&amp;/g, '&');
    name = name.replace(/\b(ALL SPONSOR(S|ED)?|VEST|SHORTS?|POLO|SUIT|JACKET|CROP TOP STYLE|LIFESTYLER|AMERICAN|REVERSIBLE|WINDBREAKER|TERRACE ICONS T-?\s*\w*|SECOND|COMMEMORATIVE)\b/gi, '');
    name = name.replace(/\s*-\s*(RED|BLUE|BLACK|WHITE|BROWN|YELLOW|GREEN|PINK|GREY|PURPLE|GOLD|BEIGE|APRICOT|DARK BLUE|CYAN)\b/gi, '');
    name = name.replace(/#\d+/g, '');
    name = name.replace(/\s{2,}/g, ' ').replace(/^\s*[-–]\s*/, '').replace(/\s*[-–]\s*$/, '').trim();
    return name || 'OUTROS';
}

async function scrapeGenericCategory(catInfo) {
    console.log(`\n🌍 ═══ ${catInfo.name} ═══`);
    
    const catSlug = catInfo.liga.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-');
    const dbCat = await prisma.categoria.upsert({
        where: { slug: catSlug },
        update: { nome: catInfo.liga },
        create: { nome: catInfo.liga, slug: catSlug }
    });
    const dbLiga = await prisma.liga.findFirst({ where: { nome: catInfo.liga, categoria_id: dbCat.id } }) ||
                   await prisma.liga.create({ data: { nome: catInfo.liga, categoria_id: dbCat.id } });
    
    const albums = await getAllAlbumsFromPage(catInfo.url);
    console.log(`   📦 ${albums.length} modelos encontrados`);
    
    let ok = 0;
    for (let i = 0; i < albums.length; i++) {
        const albumUrl = albums[i];
        const html = await getHTML(albumUrl);
        if (!html) { console.log(`   [${i+1}/${albums.length}] ❌`); continue; }
        
        let title = 'Produto';
        const m = html.match(/data-name="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        if (m) title = m[1].split('|')[0].trim();
        
        const teamName = extractTeamFromTitle(title);
        const teamSlug = teamName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        
        if (!teamSlug || teamSlug.length < 2) { console.log(`   [${i+1}/${albums.length}] ❌ nome inválido`); continue; }
        
        const dbTime = await prisma.time.upsert({
            where: { slug: teamSlug },
            update: { nome: teamName },
            create: { nome: teamName, slug: teamSlug, liga_id: dbLiga.id }
        });
        
        process.stdout.write(`   [${i+1}/${albums.length}] ${teamName.substring(0,20)} → `);
        const success = await processAlbum(albumUrl, teamName, catInfo.liga, teamSlug, dbTime);
        console.log(success ? '✅' : '❌');
        if (success) ok++;
    }
    console.log(`   ✔ ${ok}/${albums.length} importados`);
}

// ═══════════════════════════════════════════════════════════════
// VINCULAR PRODUTOS À LOJA
// ═══════════════════════════════════════════════════════════════
async function linkToStore() {
    console.log('\n🏪 Vinculando produtos à loja WZ Sport...');
    const empresa = await prisma.empresa.findUnique({ where: { slug: 'wz-sport' } });
    if (!empresa) { console.log('❌ Empresa não encontrada'); return; }
    
    const result = await prisma.$executeRawUnsafe(`
        INSERT INTO precos_empresas (empresa_id, produto_id, preco_venda, ativo, criado_em)
        SELECT ${empresa.id}, p.id, 89.90, true, NOW()
        FROM produtos p
        WHERE NOT EXISTS (SELECT 1 FROM precos_empresas pe WHERE pe.empresa_id = ${empresa.id} AND pe.produto_id = p.id)
    `);
    console.log(`   ✅ ${result} novos produtos vinculados`);
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
async function main() {
    console.log('🚀 SCRAPER MINKANG V5 — SUBCATEGORIAS POR TIME');
    console.log('   • Brasileirão: 26 times, cada um com sua página');
    console.log('   • Foto: 2ª e 3ª (regra dos 90%)');
    console.log('   • Tradução PT-BR automática');
    console.log('   • Vinculação automática à loja');
    console.log('');
    
    await scrapeBrasileirao();
    
    for (const cat of OTHER_CATEGORIES) {
        await scrapeGenericCategory(cat);
    }
    
    await linkToStore();
    
    const totalProd = await prisma.produto.count();
    const totalTime = await prisma.time.count();
    console.log(`\n═══ RESULTADO FINAL ═══`);
    console.log(`   Produtos: ${totalProd}`);
    console.log(`   Times: ${totalTime}`);
    console.log('✅ CONCLUÍDO');
    
    await prisma.$disconnect();
    process.exit(0);
}

main().catch(err => { console.error('ERRO FATAL:', err); process.exit(1); });
