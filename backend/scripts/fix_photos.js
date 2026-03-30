/**
 * fix_photos.js
 * Audita e corrige fotos duplicadas (duas de frente).
 * Para cada produto com 2 fotos, compara visualmente se são similares.
 * Se forem parecidas demais → tenta buscar uma foto de verso alternativa no álbum original.
 * Estratégia: se a 2ª e 3ª foto são similares, tenta usar as 2 últimas fotos do álbum.
 */
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const sharp = require('sharp');
const prisma = new PrismaClient({ log: [] });

async function getImageHash(url) {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 8000 });
        const img = sharp(Buffer.from(res.data));
        const meta = await img.metadata();
        const { width, height } = meta;
        
        // Verificar 4 cantos
        const cornerSize = 12;
        const corners = [];
        const positions = [
            [0, 0], [Math.max(0, width - cornerSize), 0],
            [0, Math.max(0, height - cornerSize)], [Math.max(0, width - cornerSize), Math.max(0, height - cornerSize)]
        ];
        for (const [left, top] of positions) {
            try {
                const stats = await img.clone().extract({ left, top, width: cornerSize, height: cornerSize }).stats();
                corners.push({ r: stats.channels[0].mean, g: stats.channels[1].mean, b: stats.channels[2].mean });
            } catch { corners.push({ r: 0, g: 0, b: 0 }); }
        }
        
        // Hash do centro para comparação
        const cx = Math.max(0, Math.floor(width / 2) - 30);
        const cy = Math.max(0, Math.floor(height / 2) - 30);
        const centerStats = await img.clone().extract({ left: cx, top: cy, width: 60, height: 60 }).stats();
        const centerHash = Math.round(centerStats.channels[0].mean * 1000 + centerStats.channels[1].mean * 100 + centerStats.channels[2].mean * 10);
        
        return { centerHash, corners };
    } catch {
        return { centerHash: 0, corners: [] };
    }
}

function areSimilar(hash1, hash2) {
    return Math.abs(hash1 - hash2) < 3000; // Threshold para considerar "similar"
}

async function main() {
    console.log('🔍 AUDITORIA DE FOTOS FRENTE/VERSO');
    console.log('');
    
    const produtos = await prisma.$queryRawUnsafe(`
        SELECT id, nome, fotos, slug FROM produtos WHERE array_length(fotos, 1) >= 2 LIMIT 500
    `);
    
    console.log(`📋 ${produtos.length} produtos com 2+ fotos para auditar`);
    
    let duplicates = 0;
    let fixed = 0;
    let checked = 0;
    
    for (const prod of produtos) {
        checked++;
        if (checked % 50 === 0) console.log(`   Progresso: ${checked}/${produtos.length}`);
        
        const fotos = prod.fotos;
        if (!fotos || fotos.length < 2) continue;
        
        const foto1 = typeof fotos[0] === 'string' ? fotos[0] : fotos[0];
        const foto2 = typeof fotos[1] === 'string' ? fotos[1] : fotos[1];
        
        const hash1 = await getImageHash(foto1);
        const hash2 = await getImageHash(foto2);
        
        if (areSimilar(hash1.centerHash, hash2.centerHash)) {
            duplicates++;
            
            // Tentar pegar as 2 últimas fotos do álbum como alternativa
            // Buscar o álbum original pelo slug do produto
            const albumSlug = prod.slug;
            
            // Alternativa: usar a última foto em vez da 3ª
            // Vamos buscar no álbum original se possível
            // Por enquanto, apenas logar o problema
            console.log(`   ⚠️ Fotos IGUAIS: ${prod.nome.substring(0, 50)} (hash diff: ${Math.abs(hash1.centerHash - hash2.centerHash)})`);
        }
    }
    
    console.log(`\n📊 Resultado:`);
    console.log(`   Auditados: ${checked}`);
    console.log(`   Fotos duplicadas encontradas: ${duplicates}`);
    console.log(`   Fotos únicas (frente/verso OK): ${checked - duplicates}`);
    console.log(`   Taxa de acerto: ${((checked - duplicates) / checked * 100).toFixed(1)}%`);
    
    await prisma.$disconnect();
    process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
