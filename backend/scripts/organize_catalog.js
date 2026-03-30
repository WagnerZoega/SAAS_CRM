const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

const OUTPUT_DIR = 'd:\\saas-crm\\catalogo_organizado';

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
    if (nome.includes('PREMIER') || nome.includes('LA LIGA') || nome.includes('UEFA') || nome.includes('CHAMPIONS') || nome.includes('SERIEA')) return 'EUROPEUS';
    if (nome.includes('CONMEBOL') || nome.includes('SELECOES')) return 'SELECOES';
    return 'OUTROS';
}

function getSeason(productName) {
    const match = productName.match(/(\d{2}\/\d{2})/);
    return match ? match[1].replace('/', '-') : 'OUTROS';
}

async function main() {
    console.log('--- INICIANDO ORGANIZAÇÃO DO CATÁLOGO ---');
    
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

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
        
        const dirPath = path.join(OUTPUT_DIR, category, team, season);
        
        if (!fs.existsSync(dirPath)) {
            fs.mkdirSync(dirPath, { recursive: true });
        }

        const fotos = p.fotos || [];
        for (let i = 0; i < fotos.length; i++) {
            const url = fotos[i];
            const ext = url.split('.').pop().split('?')[0] || 'jpg';
            const fileName = `foto_${i + 1}.${ext}`;
            const destPath = path.join(dirPath, fileName);
            
            console.log(`Baixando: ${category} > ${team} > ${season} (${i+1}/${fotos.length})`);
            await downloadImage(url, destPath);
        }
    }

    console.log('--- ORGANIZAÇÃO CONCLUÍDA! ---');
}

main().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
