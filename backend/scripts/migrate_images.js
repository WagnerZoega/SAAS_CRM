const { Client } = require('pg');
require('dotenv').config();
const { uploadFromYupoo } = require('./utils/storage_utils');
const { createClient } = require('@supabase/supabase-js');

const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

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

async function syncToStore(productName, photos, teamId) {
    for (const project of PROJECTS) {
        try {
            const supabase = createClient(project.url, project.key);
            
            // 1. BUSCAR INFOS DA ESTRUTURA NO MASTER
            const { rows: masterData } = await db.query(`
                SELECT t.nome as team_name, t.slug as team_slug, t.escudo_url,
                       l.nome as liga_name, c.nome as cat_name, c.slug as cat_slug
                FROM times t
                JOIN ligas l ON t.liga_id = l.id
                JOIN categorias c ON l.categoria_id = c.id
                WHERE t.id = $1
            `, [teamId]);

            if (masterData.length === 0) continue;
            const info = masterData[0];

            // 2. SINCRONIZAR ESTRUTURA NA LOJA
            const { data: dbCat } = await supabase.from('categorias').upsert({ nome: info.cat_name, slug: info.cat_slug }, { onConflict: 'slug' }).select().single();
            const { data: dbLiga } = await supabase.from('ligas').upsert({ nome: info.liga_name, categoria_id: dbCat?.id }, { onConflict: 'nome,categoria_id' }).select().single();
            const { data: dbTime } = await supabase.from('times').upsert({ nome: info.team_name, slug: info.team_slug, liga_id: dbLiga?.id, escudo_url: info.escudo_url }, { onConflict: 'slug' }).select().single();

            // 3. SINCRONIZAR PRODUTO NO MASTER_PRODUCTS DA LOJA
            const masterProductData = {
                nome: productName,
                descricao: `Camisa de time ${info.team_name || ''}`,
                foto_frente: photos[0] || null,
                foto_verso: photos[1] || null,
                imagem_url: photos[0] || null,
                imagens: photos,
                preco_custo: 50.00,
                ativo: true,
                liga: info.liga_name || 'Outros',
                categoria: info.cat_name || 'Camisas de Time',
                team_id: dbTime?.id,
                updated_at: new Date().toISOString()
            };

            const { data: mProd, error: mError } = await supabase.from('master_products').upsert(masterProductData, { onConflict: 'nome' }).select().single();
            
            if (mError || !mProd) {
                console.error(`      ❌ Erro ao upsert em master_products (${project.name}):`, mError?.message);
                continue;
            }

            // 4. AUTO-PROPAGAÇÃO: ATIVAR PARA TODOS OS LOJISTAS (PROFILES) DESTE PROJETO
            const { data: profiles } = await supabase.from('profiles').select('id, margem_global');
            
            if (profiles) {
                for (const profile of profiles) {
                    const margin = profile.margem_global || 100;
                    const precoVenda = 50.00 * (1 + (margin / 100));

                    // Upsert em store_products para cada lojista
                    // Usamos master_product_id e profile_id como chave de conflito (se configurado) ou verificamos
                    const { data: existingSP } = await supabase.from('store_products')
                        .select('id')
                        .eq('profile_id', profile.id)
                        .eq('master_product_id', mProd.id)
                        .maybeSingle();

                    if (!existingSP) {
                        await supabase.from('store_products').insert({
                            profile_id: profile.id,
                            master_product_id: mProd.id,
                            preco_venda: Math.ceil(precoVenda * 100) / 100,
                            margem: margin,
                            ativo: true,
                            estoque_disponivel: 999
                        });
                    } else {
                        // Apenas garante que está ativo se o produto mestre mudou
                        await supabase.from('store_products').update({ ativo: true }).eq('id', existingSP.id);
                    }
                }
            }

        } catch (err) {
            console.error(`      ⚠️ Falha ao sincronizar com ${project.name}:`, err.message);
        }
    }
}

async function migrateImages() {
    console.log('🖼️  INICIANDO MIGRAÇÃO E AUTO-PROPAGAÇÃO TOTAL...');
    
    try {
        await db.connect();
        
        const { rows: products } = await db.query(`
            SELECT id, nome, fotos, slug, time_id FROM produtos 
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
            await db.query(`
                UPDATE produtos 
                SET foto_principal = $1, 
                    fotos = ARRAY(SELECT jsonb_array_elements($2::jsonb))
                WHERE id = $3
            `, [newPhotos[0] || null, JSON.stringify(newPhotos), p.id]);

            // Sincronizar e ATIVAR para todos os lojistas
            await syncToStore(p.nome, newPhotos, p.team_id);
            console.log(`   ✨ Sincronizado e ATIVADO para todos os lojistas!`);
        }

        console.log('\n✅ Lote concluído!');
    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await db.end();
    }
}

migrateImages();
