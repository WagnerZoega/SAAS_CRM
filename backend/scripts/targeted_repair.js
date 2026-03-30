const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const sharp = require('sharp');
const prisma = new PrismaClient();

// ═══════════════════════════════════════════════════════════════
// MOTOR V5.2 - DETECÇÃO AVANÇADA
// ═══════════════════════════════════════════════════════════════

async function getHTML(url) {
    try {
        const res = await axios.get(url, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Referer': 'https://minkang.x.yupoo.com/',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7'
            },
            timeout: 15000
        });
        return res.data;
    } catch (err) {
        console.error(`   ❌ Erro ao acessar ${url}: ${err.message}`);
        return null;
    }
}

async function analyzePhoto(url) {
    try {
        const res = await axios.get(url, { 
            responseType: 'arraybuffer', 
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0',
                'Referer': 'https://minkang.x.yupoo.com/'
            }
        });
        const img = sharp(Buffer.from(res.data));
        const meta = await img.metadata();
        const { width, height } = meta;
        
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
                const d = Math.sqrt(
                    Math.pow(corners[i].r - corners[j].r, 2) + 
                    Math.pow(corners[i].g - corners[j].g, 2) + 
                    Math.pow(corners[i].b - corners[j].b, 2)
                );
                if (d > maxDiff) maxDiff = d;
            }
        }

        const cx = Math.max(0, Math.floor(width/2) - 25), cy = Math.max(0, Math.floor(height/2) - 25);
        const centerStats = await img.clone().extract({ left: cx, top: cy, width: 50, height: 50 }).stats();
        const hash = Math.round(centerStats.channels[0].mean * 10000 + centerStats.channels[1].mean * 100 + centerStats.channels[2].mean);

        return { isFullShot: maxDiff < 45, hash, url };
    } catch {
        return { isFullShot: false, hash: 0, url };
    }
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
            const diff = Math.abs(analyzed[i].hash - analyzed[j].hash);
            const posFactor = (i + j) / (analyzed.length * 2);
            const score = diff * (1 + posFactor);
            
            if (score > maxScore) {
                maxScore = score;
                bestA = analyzed[i];
                bestB = analyzed[j];
            }
        }
    }

    return [bestA.url, bestB.url];
}

function translateName(raw) {
    let n = raw;
    n = n.replace(/&#[xX]27;/g, "'").replace(/&amp;/g, '&');
    n = n.replace(/\b(S-\d*X*L|S-XXL|S---XXL|SIZE[:\s]*\S*|XS-\d*XL)\b/gi, '');
    n = n.replace(/\bHome\b/gi, 'Titular').replace(/\bAway\b/gi, 'Camisa II').replace(/\bThird\b/gi, 'Camisa III').replace(/\bFourth\b/gi, 'Camisa IV').replace(/\bJersey\b/gi, '').replace(/\bShirt\b/gi, '');
    return n.trim();
}

async function processAlbum(albumUrl, teamName) {
    const html = await getHTML(albumUrl);
    if (!html) return false;
    
    const titleRegex = /<span class="showalbumheader__gallerytitle">([^<]+)<\/span>/i;
    const titleMatch = html.match(titleRegex);
    let productName = titleMatch ? translateName(titleMatch[1]) : "Camisa " + teamName;
    
    const slug = productName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 190);
    
    const photos = await getFrontBackPhotos(albumUrl);
    if (photos.length === 0) return false;

    let dbTime = await prisma.time.findFirst({ where: { nome: { contains: teamName, mode: 'insensitive' } } });
    if (!dbTime) {
        dbTime = await prisma.time.create({ data: { nome: teamName, slug: teamName.toLowerCase().replace(/\s+/g, '-') } });
    }

    await prisma.produto.upsert({
        where: { slug },
        update: { nome: productName, foto_principal: photos[0], fotos: photos, time_id: dbTime.id, url_yupoo: albumUrl, ativo: true },
        create: { nome: productName, slug, time_id: dbTime.id, foto_principal: photos[0], fotos: photos, preco_custo: 50.00, url_yupoo: albumUrl, ativo: true }
    });
    
    return true;
}

async function scrapeCategory(catUrl, teamNameDefault) {
    let html = await getHTML(catUrl);
    if (!html) {
        console.log(`❌ Falha ao carregar HTML de ${catUrl}`);
        return;
    }
    
    const albums = [];
    // Regex mais flexível para capturar o link do álbum e o título
    const regex = /<a [^>]*href="([^"]*\/albums\/\d+[^"]*)"[^>]*title="([^"]+)"/gi;
    let m;
    while ((m = regex.exec(html)) !== null) {
        let url = m[1];
        if (!url.startsWith('http')) url = 'https://minkang.x.yupoo.com' + url;
        albums.push({ url, title: m[2] });
    }
    
    if (albums.length === 0) {
        console.log(`⚠️ Nenhum álbum encontrado para ${teamNameDefault} em ${catUrl}`);
        // Log para debug do HTML (primeiros 500 chars do body)
        const bodyMatch = html.match(/<body[^>]*>([\s\S]+)/i);
        if (bodyMatch) console.log("   Debug HTML snippet:", bodyMatch[1].substring(0, 300).replace(/\s+/g, ' '));
        return;
    }

    console.log(`⚽ Sincronizando ${teamNameDefault} (${albums.length} itens)...`);
    for (let i = 0; i < albums.length; i++) {
        const ok = await processAlbum(albums[i].url, teamNameDefault);
        process.stdout.write(ok ? '✅' : '❌');
        if ((i+1) % 10 === 0) console.log(` [${i+1}/${albums.length}]`);
    }
    console.log('\n');
}

async function main() {
    console.log('🚀 INICIANDO REPARO DIRECIONADO V5.2');
    
    // 1. Athletico Paranaense
    await scrapeCategory('https://minkang.x.yupoo.com/categories/720322?isSubCate=true', 'Athletico Paranaense');
    
    // 2. Categoria Retro (Geral)
    await scrapeCategory('https://minkang.x.yupoo.com/categories/711624', 'RETRO');
    
    console.log('✅ REPARO CONCLUÍDO');
    await prisma.$disconnect();
}

main();
