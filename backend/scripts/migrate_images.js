const { Client } = require('pg');
require('dotenv').config();
const { uploadFromYupoo } = require('./utils/storage_utils');
const { createClient } = require('@supabase/supabase-js');

const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Configuração das lojas para sincronização
const PROJECTS = [
    {
        name: "LXM",
        url: "https://lxmdimddxzouysdxhqob.supabase.co",
        key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bWRpbWRkeHpvdXlzZHhocW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDExMjcsImV4cCI6MjA5MDYxNzEyN30.X6xMSUTxPNYbu0rbYSOsrHFIbG6nDZJiKwwVq8579ws"
    },
    {
        name: "PRI",
        url: "https://pricozkynavwrthtdcmn.supabase.co",
        key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaWNvemt5bmF2d3J0aHRkY21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTk0NDEsImV4cCI6MjA5MDQ3NTQ0MX0.UjogRabuutUnRkgYv7ecV0hMtspQlCVTiRo-l2532jI"
    }
];

async function syncToStore(productName, photos) {
    for (const project of PROJECTS) {
        try {
            const supabase = createClient(project.url, project.key);
            const foto_frente = photos[0] || null;
            const foto_verso = photos[1] || null;

            const { data: existing } = await supabase.from('master_products').select('id').eq('nome', productName).maybeSingle();
            if (existing) {
                await supabase.from('master_products').update({
                    foto_frente: foto_frente,
                    foto_verso: foto_verso,
                    imagem_url: foto_frente,
                    imagens: photos,
                    updated_at: new Date().toISOString()
                }).eq('id', existing.id);
            }
        } catch (err) {
            console.error(`      ⚠️ Falha ao sincronizar com ${project.name}:`, err.message);
        }
    }
}

async function migrateImages() {
    console.log('🖼️  INICIANDO MIGRAÇÃO TOTAL E SYNC (Yupoo -> Supabase Storage)...');
    
    try {
        await db.connect();
        
        // Buscar produtos que ainda usam Yupoo
        const { rows: products } = await db.query(`
            SELECT id, nome, fotos, slug FROM produtos 
            WHERE (foto_principal LIKE '%yupoo.com%' OR fotos::text LIKE '%yupoo.com%')
            ORDER BY id DESC
            LIMIT 500
        `);

        if (products.length === 0) {
            console.log('✅ Tudo limpo! Não há mais fotos pendentes do Yupoo.');
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

                const extension = oldUrl.split('.').pop().split('?')[0] || 'jpg';
                const path = `products/${p.slug}/${p.id}_${i}.${extension}`;

                process.stdout.write(`   [${i+1}/${p.fotos.length}] Enviando... `);
                const newUrl = await uploadFromYupoo(oldUrl, path);
                
                if (newUrl) {
                    newPhotos.push(newUrl);
                    console.log('✅');
                } else {
                    newPhotos.push(oldUrl);
                    console.log('❌');
                }
            }

            // Atualizar Banco Local
            const foto_principal = newPhotos[0] || null;
            await db.query(`
                UPDATE produtos 
                SET foto_principal = $1, 
                    fotos = ARRAY(SELECT jsonb_array_elements($2::jsonb))
                WHERE id = $3
            `, [foto_principal, JSON.stringify(newPhotos), p.id]);

            // Sincronizar com as lojas
            await syncToStore(p.nome, newPhotos);
            console.log(`   ✨ Sincronizado com as lojas!`);
        }

        console.log('\n✅ Lote concluído!');
    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await db.end();
    }
}

migrateImages();
