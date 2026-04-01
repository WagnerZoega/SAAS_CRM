const { Client } = require('pg');
require('dotenv').config();
const { uploadFromYupoo } = require('./utils/storage_utils');

const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrateImages() {
    console.log('🖼️  INICIANDO MIGRAÇÃO DE IMAGENS (Yupoo -> Supabase Storage)...');
    
    try {
        await db.connect();
        
        // 1. Buscar produtos do Catálogo Mestre que ainda têm links do Yupoo
        const { rows: products } = await db.query(`
            SELECT id, nome, fotos, slug FROM master_products 
            WHERE (foto_frente LIKE '%yupoo.com%' OR fotos::text LIKE '%yupoo.com%')
            LIMIT 50 -- Vamos processar em lotes
        `);

        if (products.length === 0) {
            console.log('✅ Todos os produtos já estão com imagens migradas ou não há produtos no banco.');
            return;
        }

        console.log(`📦 Encontrados ${products.length} produtos para processar.`);

        for (const p of products) {
            console.log(`\n⚽ Processando: ${p.nome}`);
            const newPhotos = [];
            
            for (let i = 0; i < p.fotos.length; i++) {
                const oldUrl = p.fotos[i];
                if (!oldUrl.includes('yupoo.com')) {
                    newPhotos.push(oldUrl);
                    continue;
                }

                // Gerar caminho amigável: produtos/slug/123_0.jpg
                const extension = oldUrl.split('.').pop().split('?')[0] || 'jpg';
                const path = `products/${p.slug}/${p.id}_${i}.${extension}`;

                process.stdout.write(`   [${i+1}/${p.fotos.length}] Enviando para Storage... `);
                const newUrl = await uploadFromYupoo(oldUrl, path);
                
                if (newUrl) {
                    newPhotos.push(newUrl);
                    console.log('✅');
                } else {
                    newPhotos.push(oldUrl); // Mantém o antigo se falhar
                    console.log('❌');
                }
            }

            // 2. Atualizar o banco de dados com as NOVAS URLs
            const foto_frente = newPhotos[0] || null;
            const foto_verso = newPhotos[1] || null;

            await db.query(`
                UPDATE master_products 
                SET foto_frente = $1, 
                    foto_verso = $2, 
                    imagem_url = $1, 
                    imagens = $3
                WHERE id = $4
            `, [foto_frente, foto_verso, newPhotos, p.id]);

            console.log(`   ✨ Produto atualizado no banco!`);
        }

        console.log('\n✅ Migração concluída com sucesso para este lote!');
    } catch (err) {
        console.error('❌ Erro fatal na migração:', err.message);
    } finally {
        await db.end();
    }
}

migrateImages();
