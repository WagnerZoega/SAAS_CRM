const { Client } = require('pg');
require('dotenv').config();
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

async function syncAll() {
    console.log('🔄 INICIANDO SINCRONIZAÇÃO TOTAL (Mestre -> Lojas)...');
    
    try {
        await db.connect();
        
        // 1. Pegar todos os produtos do Mestre
        const { rows: products } = await db.query(`
            SELECT p.id, p.nome, p.fotos, p.foto_principal, p.time_id,
                   t.nome as team_name, t.slug as team_slug, t.escudo_url,
                   l.nome as liga_name, c.nome as cat_name, c.slug as cat_slug
            FROM produtos p
            JOIN times t ON p.time_id = t.id
            JOIN ligas l ON t.liga_id = l.id
            JOIN categorias c ON l.categoria_id = c.id
            WHERE p.ativo = true
        `);

        console.log(`📦 Processando ${products.length} produtos para ${PROJECTS.length} projetos.`);

        for (const project of PROJECTS) {
            console.log(`\n⚙️ Sincronizando Projeto: ${project.name}`);
            const supabase = createClient(project.url, project.key);
            
            // Buscar lojistas deste projeto
            const { data: profiles } = await supabase.from('profiles').select('id, margem_global');
            if (!profiles || profiles.length === 0) {
                console.log(`   ⚠️ Nenhum lojista encontrado em ${project.name}`);
                continue;
            }

            for (const p of products) {
                process.stdout.write(`   ⚽ ${p.nome.substring(0, 30)}... `);

                // A. Sincronizar Estrutura
                const { data: dbCat } = await supabase.from('categorias').upsert({ nome: p.cat_name, slug: p.cat_slug }, { onConflict: 'slug' }).select().single();
                const { data: dbLiga } = await supabase.from('ligas').upsert({ nome: p.liga_name, categoria_id: dbCat?.id }, { onConflict: 'nome,categoria_id' }).select().single();
                const { data: dbTime } = await supabase.from('times').upsert({ nome: p.team_name, slug: p.team_slug, liga_id: dbLiga?.id, escudo_url: p.escudo_url }, { onConflict: 'slug' }).select().single();

                // B. Master Product
                const masterProductData = {
                    nome: p.nome,
                    descricao: `Camisa de time ${p.team_name}`,
                    foto_frente: p.foto_principal,
                    foto_verso: (p.fotos && p.fotos.length > 1) ? p.fotos[1] : null,
                    imagem_url: p.foto_principal,
                    imagens: p.fotos,
                    preco_custo: 50.00,
                    ativo: true,
                    liga: p.liga_name,
                    categoria: p.cat_name,
                    team_id: dbTime?.id,
                    updated_at: new Date().toISOString()
                };

                const { data: mProd } = await supabase.from('master_products').upsert(masterProductData, { onConflict: 'nome' }).select().single();

                if (mProd) {
                    for (const profile of profiles) {
                        const margin = profile.margem_global || 100;
                        const precoVenda = 50.00 * (1 + (margin / 100));

                        await supabase.from('store_products').upsert({
                            profile_id: profile.id,
                            master_product_id: mProd.id,
                            preco_venda: Math.ceil(precoVenda * 100) / 100,
                            margem: margin,
                            ativo: true,
                            estoque_disponivel: 999
                        }, { onConflict: 'profile_id,master_product_id' });
                    }
                    console.log('✅');
                } else {
                    console.log('❌');
                }
            }
        }

        console.log('\n🚀 SINCRONIZAÇÃO TOTAL CONCLUÍDA!');
    } catch (err) {
        console.error('❌ Erro fatal:', err.message);
    } finally {
        await db.end();
    }
}

syncAll();
