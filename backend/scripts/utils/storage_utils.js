const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://zvuuchxppfvdsndxmhsc.supabase.co';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
if (supabaseServiceRoleKey) {
    supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
}

/**
 * Baixa uma imagem do Yupoo com o Referer correto e faz upload para o Supabase Storage.
 * @param {string} yupooUrl URL da imagem no Yupoo (ex: https://photo.yupoo.com/...)
 * @param {string} path Caminho dentro do bucket (ex: products/time/nome-produto.jpg)
 * @returns {Promise<string|null>} Retorna a URL pública do Supabase ou null se falhar.
 */
async function uploadFromYupoo(yupooUrl, path) {
    if (!supabase) {
        console.error('      ⚠️ Supabase não configurado no .env (SUPABASE_SERVICE_ROLE_KEY)');
        return null;
    }

    try {
        // 1. Download da imagem (Burlado o Hotlink Protection)
        const response = await axios({
            url: yupooUrl,
            method: 'GET',
            responseType: 'arraybuffer',
            headers: {
                'Referer': 'https://yupoo.com/',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 10000
        });

        const buffer = Buffer.from(response.data, 'binary');
        const contentType = response.headers['content-type'] || 'image/jpeg';

        // 2. Upload para o Supabase Bucket 'produtos'
        const { data, error } = await supabase.storage
            .from('produtos')
            .upload(path, buffer, {
                contentType: contentType,
                upsert: true
            });

        if (error) {
            console.error('      ❌ Erro upload Supabase:', error.message);
            return null;
        }

        // 3. Pegar a URL Pública
        const { data: publicData } = supabase.storage
            .from('produtos')
            .getPublicUrl(path);

        return publicData.publicUrl;
    } catch (err) {
        console.error(`      ❌ Erro no Proxy Yupoo -> Supabase (${yupooUrl}):`, err.message);
        return null;
    }
}

module.exports = { uploadFromYupoo };
