const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const sharp = require('sharp');
const prisma = new PrismaClient({ log: [] });

// ═══════════════════════════════════════════════════════════════
// MOTOR V5.2 - ANÁLISE AVANÇADA DE FOTOS
// ═══════════════════════════════════════════════════════════════

async function analyzePhotoV52(url) {
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
        
        // Regra dos 4 Cantos (Uniformidade)
        const cs = 12;
        const positions = [[0, 0], [width - cs, 0], [0, height - cs], [width - cs, height - cs]];
        let corners = [];
        for (const [l, t] of positions) {
            const st = await img.clone().extract({ left: l, top: t, width: cs, height: cs }).stats();
            corners.push({ r: st.channels[0].mean, g: st.channels[1].mean, b: st.channels[2].mean });
        }
        
        let maxDiffBetweenCorners = 0;
        for (let i = 0; i < 4; i++) {
            for (let j = i + 1; j < 4; j++) {
                const d = Math.sqrt(
                    Math.pow(corners[i].r - corners[j].r, 2) + 
                    Math.pow(corners[i].g - corners[j].g, 2) + 
                    Math.pow(corners[i].b - corners[j].b, 2)
                );
                if (d > maxDiffBetweenCorners) maxDiffBetweenCorners = d;
            }
        }

        // Variância Central (Complexidade)
        const cx = Math.max(0, Math.floor(width/2) - 25), cy = Math.max(0, Math.floor(height/2) - 25);
        const centerStats = await img.clone().extract({ left: cx, top: cy, width: 50, height: 50 }).stats();
        const r = centerStats.channels[0].mean, g = centerStats.channels[1].mean, b = centerStats.channels[2].mean;
        const hash = Math.round(r * 10000 + g * 100 + b);

        // Um "Full Shot" tem os 4 cantos parecidos (fundo uniforme)
        // Usamos um threshold de 45 para o diff máximo entre cantos.
        const isFullShot = maxDiffBetweenCorners < 45;
        
        return { isFullShot, hash, url };
    } catch {
        return { isFullShot: false, hash: 0, url };
    }
}

async function getBestPairV52(photoUrls) {
    // 1. Filtrar apenas as fotos únicas (ignorando duplicatas de tamanho do Yupoo como square.jpg)
    const uniqueBases = [...new Set(photoUrls.filter(u => !u.includes('square.jpg') && !u.includes('small.jpg') && !u.includes('medium.jpg')))];
    
    // 2. Analisar cada uma
    const analyzed = [];
    for (const url of uniqueBases) {
        const res = await analyzePhotoV52(url);
        if (res.isFullShot) analyzed.push(res);
    }
    
    if (analyzed.length < 2) {
        // Fallback: se não achou pares bons, pega a 2ª e a penúltima (regra clássica)
        return photoUrls.length > 2 ? [photoUrls[1], photoUrls[photoUrls.length - 2]] : [photoUrls[0], photoUrls[photoUrls.length - 1]];
    }
    
    // 3. Selecionar o par com MAIOR diferença de hash (Frente vs Verso)
    let bestA, bestB, maxHashDiff = -1;
    for (let i = 0; i < analyzed.length; i++) {
        for (let j = i + 1; j < analyzed.length; j++) {
            const diff = Math.abs(analyzed[i].hash - analyzed[j].hash);
            
            // Heurística de Prioridade: Se o álbum for longo (> 4 full shots), 
            // e tivermos uma diferença de hash razoável, 
            // preferimos os pares que estão mais próximos do fim do álbum (dica do usuário).
            const posFactor = (i + j) / (analyzed.length * 2);
            const score = diff * (1 + posFactor); 

            if (score > maxHashDiff) {
                maxHashDiff = score;
                bestA = analyzed[i];
                bestB = analyzed[j];
            }
        }
    }
    
    // Garantir que a foto com o hash que costuma ser "frente" seja a primeira (heurística leve)
    return [bestA.url, bestB.url];
}

// ═══════════════════════════════════════════════════════════════
// LOGICA DE REPARO
// ═══════════════════════════════════════════════════════════════

async function repairProduct(product) {
    console.log(`\nAuditando: ${product.nome}...`);
    
    // Como não temos a URL do álbum no DB, vamos tentar obter as fotos atuais
    // e extrair o álbum a partir do HTML das categorias se necessário.
    // Mas para este script de reparo, vamos focar em álbuns que ja mapeamos ou re-scrapear.
    
    // NOTA: Para este script ser escalável, o scraper PRECISA salvar o link do álbum.
    // Vou rodar o reparo especificamente para os IDs conhecidos primeiro.
}

async function runRepairTask() {
    // Exemplo: Reparar Flamengo 1994
    const products = await prisma.produto.findMany({
        where: {
            OR: [
                { nome: { contains: 'Flamengo 1994', mode: 'insensitive' } },
                { nome: { contains: 'Retro', mode: 'insensitive' } }
            ]
        }
    });

    console.log(`Encontrados ${products.length} produtos para possível reparo.`);
    
    // Para cada produto, precisaríamos da URL do Yupoo. 
    // Como o scraper original não salvou, vamos ter que re-navegar as categorias.
    // Para agilizar, vamos atualizar o SCAPER principal para V5.2 e rodar um sync específico.
}

// Vou expor a função de análise para ser usada no motor principal.
module.exports = { analyzePhotoV52, getBestPairV52 };

if (require.main === module) {
    // Teste isolado para o Flamengo 1994
    (async () => {
        const photos = [
            "https://photo.yupoo.com/minkang/8880900b/0047ab61.jpg",
            "https://photo.yupoo.com/minkang/0bbfef2a/d8043471.jpg",
            "https://photo.yupoo.com/minkang/83f774a5/670d68a2.jpg",
            "https://photo.yupoo.com/minkang/7cf91cbe/e281906e.jpg",
            "https://photo.yupoo.com/minkang/7532a54a/3a3c273b.jpg",
            "https://photo.yupoo.com/minkang/51e9b31e/f58dc070.jpg",
            "https://photo.yupoo.com/minkang/616b631f/a21d1ddf.jpg"
        ];
        const best = await getBestPairV52(photos);
        console.log("Melhor par capturado:");
        console.log(best);
        process.exit(0);
    })();
}
