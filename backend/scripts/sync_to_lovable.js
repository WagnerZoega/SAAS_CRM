const { Client } = require('pg');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// 🚀 LISTA DE PROJETOS PARA SINCRONIZAR
const PROJECTS = [
    {
        name: "Projeto LXM",
        url: "https://lxmdimddxzouysdxhqob.supabase.co",
        key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4bWRpbWRkeHpvdXlzZHhocW9iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwNDExMjcsImV4cCI6MjA5MDYxNzEyN30.X6xMSUTxPNYbu0rbYSOsrHFIbG6nDZJiKwwVq8579ws"
    },
    {
        name: "Projeto PRI",
        url: "https://pricozkynavwrthtdcmn.supabase.co",
        key: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InByaWNvemt5bmF2d3J0aHRkY21uIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTk0NDEsImV4cCI6MjA5MDQ3NTQ0MX0.UjogRabuutUnRkgYv7ecV0hMtspQlCVTiRo-l2532jI"
    }
];

// Configurações do Scraper local (Lendo do .env)
const localClient = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function syncProject(pSource, project) {
    console.log(`\n--- 🔄 Sincronizando: ${project.name} ---`);
    const supabase = createClient(project.url, project.key);

    for (const p of pSource) {
        // 📸 Processamento de Fotos do Banco Local
        let fotos = p.fotos || [];
        if (typeof fotos === 'string') {
            try { fotos = JSON.parse(fotos); } catch (e) { fotos = []; }
        }

        // Lógica Inteligente: Ignora ícones, logos, tabelas de medidas e etiquetas na foto principal
        let fotosValidas = fotos.filter(f => 
            f && 
            !f.toLowerCase().includes('icon') && 
            !f.toLowerCase().includes('logo') && 
            !f.toLowerCase().includes('tag') && 
            !f.toLowerCase().includes('table') && 
            !f.toLowerCase().includes('size')
        );

        if (fotosValidas.length === 0) fotosValidas = fotos; // fallback se não houver filtro

        // Lógica de 2ª e 3ª Foto (Ignorar Thumbnail)
        // Se houver pelo menos 3 fotos, a 1ª (index 0) é lixo/thumb.
        const foto_frente = (fotosValidas.length >= 2) ? fotosValidas[1] : (fotosValidas.length > 0 ? fotosValidas[0] : (p.foto_principal || null));
        const foto_verso = (fotosValidas.length >= 3) ? fotosValidas[2] : (fotosValidas.length > 1 ? fotosValidas[1] : null);

        const masterProductData = {
            nome: p.nome,
            descricao: p.descricao || `Camisa de time ${p.time_nome || ''}`,
            foto_frente: foto_frente,
            foto_verso: foto_verso,
            imagem_url: foto_frente,
            imagens: fotosValidas,
            preco_custo: p.preco_custo ? parseFloat(p.preco_custo) : 50.00,
            ativo: p.ativo,
            liga: p.liga_nome || 'Outros',
            categoria: p.categoria_nome || 'Camisas de Time',
            updated_at: new Date().toISOString()
        };

        process.stdout.write(`   [${project.name}] ${p.nome.substring(0, 30)}... `);

        // 1. Verificar se existe pelo nome
        const { data: existing } = await supabase
            .from('master_products')
            .select('id')
            .eq('nome', p.nome)
            .maybeSingle();

        let resAction;
        if (existing) {
            resAction = await supabase.from('master_products').update(masterProductData).eq('id', existing.id);
        } else {
            resAction = await supabase.from('master_products').insert(masterProductData);
        }

        if (resAction.error) {
            console.log(`❌ Erro: ${resAction.error.message}`);
        } else {
            console.log(existing ? `✅ Atualizado!` : `✅ Criado!`);
        }
    }
}

async function startSync() {
    console.log('🚀 Iniciando sincronização MULTI-PROJETO via SQL Direto...');

    try {
        await localClient.connect();

        const res = await localClient.query(`
            SELECT 
                p.*, 
                t.nome as time_nome,
                l.nome as liga_nome,
                c.nome as categoria_nome
            FROM produtos p
            LEFT JOIN times t ON p.time_id = t.id
            LEFT JOIN ligas l ON t.liga_id = l.id
            LEFT JOIN categorias c ON l.categoria_id = c.id
            WHERE p.ativo = true
        `);

        const produtosRaw = res.rows;
        console.log(`📦 Encontrados ${produtosRaw.length} produtos no banco local.`);

        // Sincronizar em cada projeto
        for (const project of PROJECTS) {
            if (project.key.includes("COLE_AQUI")) {
                console.log(`\n⚠️ Pulando ${project.name}: Chave não configurada.`);
                continue;
            }
            await syncProject(produtosRaw, project);
        }

    } catch (err) {
        console.error('❌ Erro na sincronização:', err.message);
    } finally {
        await localClient.end();
        console.log('\n🏁 Sincronização MULTI-PROJETO concluída!');
    }
}

startSync();
