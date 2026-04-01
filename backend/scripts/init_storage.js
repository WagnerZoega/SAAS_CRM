const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
    console.error('❌ Faltam chaves no .env (SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function initStorage() {
    console.log('📦 Iniciando configuração do Storage no Supabase...');
    
    // 1. Criar o bucket se não existir
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) { console.error('   ❌ Erro ao listar buckets:', listError.message); return; }

    const exists = buckets.find(b => b.name === 'produtos');
    if (!exists) {
        console.log('   🛠️ Criando bucket "produtos"...');
        const { error: createError } = await supabase.storage.createBucket('produtos', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
            fileSizeLimit: 5242880 // 5MB
        });
        if (createError) { console.error('   ❌ Erro ao criar bucket:', createError.message); return; }
        console.log('   ✅ Bucket "produtos" criado!');
    } else {
        console.log('   ✅ Bucket "produtos" já existe.');
        // Garantir que está público
        if (!exists.public) {
            console.log('   🛠️ Alterando bucket para Público...');
            await supabase.storage.updateBucket('produtos', { public: true });
        }
    }

    console.log('🚀 STORAGE PRONTO PARA USO!');
}

initStorage();
