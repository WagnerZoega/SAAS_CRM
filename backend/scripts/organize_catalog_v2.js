const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const OUTPUT_DIR = 'd:\\saas-crm\\catalogo_organizado_v2';

// Lista de termos que indicam que a foto NÃO é a principal/inteira
const TERMOS_DETALHE = [
    'detail', 'detalhe', 'tag', 'label', 'logo', 'badge', 'close', 'zoom', 
    'sleeve', 'manga', 'collar', 'gola', 'back', 'costas', 'inside', 'dentro',
    'patch', 'fabric', 'tecido', 'stitching', 'costura', 'name', 'number'
];

async function downloadImage(url, destPath) {
    if (fs.existsSync(destPath)) return;
    
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream',
            timeout: 15000,
            headers: {
                'Referer': 'https://www.yupoo.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        const writer = fs.createWriteStream(destPath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (err) {
        console.error(`Erro ao baixar ${url}: ${err.message}`);
    }
}

function getCategory(ligaNome) {
    const nome = (ligaNome || '').toUpperCase();
    if (nome.includes('SERIE_A') || nome.includes('SÉRIE A') || nome.includes('SERIE_B') || nome.includes('SÉRIE B')) return 'BRASILEIRO';
    if (nome.includes('PREMIER') || nome.includes('LA LIGA') || nome.includes('UEFA') || nome.includes('CHAMPIONS') || nome.includes('SERIEA') || nome.includes('EURO')) return 'EUROPEUS';
    if (nome.includes('CONMEBOL') || nome.includes('SELECOES')) return 'SELECOES';
    return 'OUTROS';
}

function getSeason(productName) {
    const match = productName.match(/(\d{2}\/\d{2})/);
    return match ? match[1].replace('/', '-') : 'OUTROS';
}

async function main() {
    console.log('--- INICIANDO ORGANIZAÇÃO DO CATÁLOGO V2 (Finas & Detalhes) ---');
    
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

    const products = await prisma.produto.findMany({
        include: {
            time: {
                include: {
                    liga: true
                }
            }
        }
    });

    console.log(`Encontrados ${products.length} produtos.`);

    for (const p of products) {
        const category = getCategory(p.time?.liga?.nome);
        const team = (p.time?.nome || 'DESCONHECIDO').replace(/[\/\\?%*:|"<>]/g, '-');
        const season = getSeason(p.nome);
        
        // Estrutura: Categoria > Time > Temporada > [PRINCIPAIS vs DETALHES]
        const baseDir = path.join(OUTPUT_DIR, category, team, season);
        const mainDir = path.join(baseDir, 'FOTOS_PRINCIPAIS');
        const detailDir = path.join(baseDir, 'DETALHES_E_TAGS');

        const fotos = p.fotos || [];
        for (let i = 0; i < fotos.length; i++) {
            const url = fotos[i].toLowerCase();
            
            // Lógica de separação: A primeira foto do Yupoo costuma ser a principal.
            // As outras fotos verificamos se tem termos de detalhes na URL.
            let isDetail = i > 0 && TERMOS_DETALHE.some(t => url.includes(t));
            
            // Se for o primeiro mas tiver termo de detalhe (raro), ainda tratamos como principal
            // a menos que seja explicitamente um "zoom" ou "tag".
            if (i === 0) isDetail = false; 

            const targetDir = isDetail ? detailDir : mainDir;
            if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

            const ext = fotos[i].split('.').pop().split('?')[0] || 'jpg';
            const fileName = `foto_${i + 1}.${ext}`;
            const destPath = path.join(targetDir, fileName);
            
            console.log(`Baixando [${isDetail ? 'DETALHE' : 'PRINCIPAL'}]: ${team} > ${season} (${i+1}/${fotos.length})`);
            await downloadImage(fotos[i], destPath);
        }
    }

    console.log('--- ORGANIZAÇÃO CONCLUÍDA NO V2! ---');
}

main().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
