const { Client } = require('pg');
const axios = require('axios');
require('dotenv').config();
// const sharp = require('sharp'); // Removido para evitar erros de instalação no Windows
const { createClient } = require('@supabase/supabase-js');
const { uploadFromYupoo } = require('./utils/storage_utils');

const db = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// 🚀 CONFIGURAÇÃO DE AUTO-SYNC PARA LOVABLE (SUPABASE)
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

async function syncToSupabase(productName, photos, teamName, ligaNome, categoriaNome, ativo) {
    for (const project of PROJECTS) {
        if (project.key.includes("COLE_AQUI")) continue;

        try {
            const supabase = createClient(project.url, project.key);
            const foto_frente = (Array.isArray(photos) && photos.length > 0) ? photos[0] : null;
            const foto_verso = (Array.isArray(photos) && photos.length > 1) ? photos[1] : null;

            const masterProductData = {
                nome: productName,
                descricao: `Camisa de time ${teamName || ''}`,
                foto_frente: foto_frente,
                foto_verso: foto_verso,
                imagem_url: foto_frente,
                imagens: photos,
                preco_custo: 50.00,
                ativo: ativo,
                liga: ligaNome || 'Outros',
                categoria: categoriaNome || 'Camisas de Time',
                updated_at: new Date().toISOString()
            };

            // Verificar se existe pelo nome para evitar erro de RLS/Constraint
            const { data: existing } = await supabase.from('master_products').select('id').eq('nome', productName).maybeSingle();

            if (existing) {
                await supabase.from('master_products').update(masterProductData).eq('id', existing.id);
            } else {
                await supabase.from('master_products').insert(masterProductData);
            }
        } catch (err) {
            console.error(`   ⚠️ Erro no auto-sync (${project.name}):`, err.message);
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// ESTRATÉGIA V5: Entrar em CADA TIME individualmente
// Regra de foto: 2ª e 3ª (90% dos casos) | Fallback: 2 últimas
// ═══════════════════════════════════════════════════════════════

// Brasileirão - Cada time com sua subcategoria
const BRASILEIRAO_TEAMS = [
    { team: 'Flamengo', url: 'https://minkang.x.yupoo.com/categories/720314?isSubCate=true' },
    { team: 'Palmeiras', url: 'https://minkang.x.yupoo.com/categories/720315?isSubCate=true' },
    { team: 'Sao Paulo', url: 'https://minkang.x.yupoo.com/categories/720316?isSubCate=true' },
    { team: 'Corinthians', url: 'https://minkang.x.yupoo.com/categories/720317?isSubCate=true' },
    { team: 'Santos', url: 'https://minkang.x.yupoo.com/categories/720318?isSubCate=true' },
    { team: 'Athletico Paranaense', url: 'https://minkang.x.yupoo.com/categories/720322?isSubCate=true' },
    { team: 'Internacional', url: 'https://minkang.x.yupoo.com/categories/720319?isSubCate=true' },
    { team: 'Gremio', url: 'https://minkang.x.yupoo.com/categories/720320?isSubCate=true' },
    { team: 'Fluminense', url: 'https://minkang.x.yupoo.com/categories/720321?isSubCate=true' },
    { team: 'Vasco', url: 'https://minkang.x.yupoo.com/categories/720323?isSubCate=true' },
    { team: 'Botafogo', url: 'https://minkang.x.yupoo.com/categories/720324?isSubCate=true' },
    { team: 'Cruzeiro', url: 'https://minkang.x.yupoo.com/categories/720325?isSubCate=true' },
    { team: 'Atletico Mineiro', url: 'https://minkang.x.yupoo.com/categories/720326?isSubCate=true' },
    { team: 'Bahia', url: 'https://minkang.x.yupoo.com/categories/720327?isSubCate=true' },
    { team: 'Fortaleza', url: 'https://minkang.x.yupoo.com/categories/720328?isSubCate=true' },
    { team: 'Coritiba', url: 'https://minkang.x.yupoo.com/categories/720329?isSubCate=true' },
    { team: 'Cuiaba', url: 'https://minkang.x.yupoo.com/categories/720330?isSubCate=true' },
    { team: 'Goias', url: 'https://minkang.x.yupoo.com/categories/720331?isSubCate=true' },
    { team: 'Bragantino', url: 'https://minkang.x.yupoo.com/categories/720333?isSubCate=true' }
];

const OTHER_CATEGORIES = [
    { name: 'RETRO', url: 'https://minkang.x.yupoo.com/categories/711624', liga: 'RETRO' },
    { name: 'PREMIER LEAGUE', url: 'https://minkang.x.yupoo.com/categories/680720', liga: 'PREMIER LEAGUE' },
    { name: 'LA LIGA', url: 'https://minkang.x.yupoo.com/categories/680717', liga: 'LA LIGA' },
    { name: 'SERIE A', url: 'https://minkang.x.yupoo.com/categories/680719', liga: 'SERIE A' },
    { name: 'BUNDESLIGA', url: 'https://minkang.x.yupoo.com/categories/680718', liga: 'BUNDESLIGA' },
    { name: 'LIGUE 1', url: 'https://minkang.x.yupoo.com/categories/680721', liga: 'LIGUE 1' }
];

// ═══════════════════════════════════════════════════════════════
// TRADUÇÃO PT-BR
// ═══════════════════════════════════════════════════════════════
function translateName(raw) {
    let n = raw;
    // HTML entities
    n = n.replace(/&#[xX]27;/g, "'").replace(/&amp;/g, '&');
    // Tamanhos
    n = n.replace(/\b(S-\d*X*L|S-XXL|S---XXL|SIZE[:\s]*\S*|XS-\d*XL)\b/gi, '');
    // Traduções
    n = n.replace(/\bHome\b/gi, 'Titular');
    n = n.replace(/\bAway\b/gi, 'Camisa II');
    n = n.replace(/\bThird\b/gi, 'Camisa III');
    n = n.replace(/\bGoalkeeper\b/gi, 'Goleiro');
    n = n.replace(/\bGK\b/gi, 'Goleiro');
    n = n.replace(/\bSpecial Edition\b/gi, 'Edição Especial');
    n = n.replace(/\bPlayer Version\b/gi, 'Versão Jogador');
    n = n.replace(/\bTraining\b/gi, 'Treino');
    n = n.replace(/\bPre[- ]?Match\b/gi, 'Pré-Jogo');
    n = n.replace(/\bRetro\b/gi, 'Retrô');
    n = n.replace(/\bLong Sleeve[d]?\b/gi, 'Manga Longa');
    n = n.replace(/\bWomen'?s?\b/gi, 'Feminina');
    n = n.replace(/\bKids?\b/gi, 'Infantil');
    // Remover sujeira
    n = n.replace(/\b(Jersey|Shirt|Kit|Football|Soccer)\b/gi, '');
    n = n.replace(/\s{2,}/g, ' ').trim();
    n = n.replace(/\s*[-–]\s*$/, '').trim();
    return n;
}

// ═══════════════════════════════════════════════════════════════
// FUNÇÕES DE REDE E FOTOS V5.3
// ═══════════════════════════════════════════════════════════════

function getSaturation(r, g, b) {
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    const d = max - min;
    return max === 0 ? 0 : d / max;
}

async function getHTML(url) {
    try {
        const res = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
            timeout: 15000
        });
        return res.data;
    } catch (err) { return null; }
}

async function analyzePhoto(url) {
    // V5.8: Desativado Sharp. Confiando na regra de 90% (2ª e 3ª fotos).
    return { isFullShot: true, hash: Math.random(), contourHash: Math.random(), url };
}

async function getFrontBackPhotos(albumUrl) {
    const html = await getHTML(albumUrl);
    if (!html) return [];

    const regex = /https:\/\/photo\.yupoo\.com\/[^\/]+\/[^\/]+\/[^"'\s<>]+(?:\.jpg|\.jpeg|\.png)/gi;
    const matches = html.match(regex) || [];
    const unique = [...new Set(matches.map(img => img.split('?')[0]))].filter(img => {
        const l = img.toLowerCase();
        return !l.includes('icon') && !l.includes('logo') && !l.includes('square') && !l.includes('small') && !l.includes('medium');
    });

    if (unique.length === 0) return [];
    if (unique.length <= 2) return unique.slice(0, 2);

    // V5.7: Estratégia Prioritária: 2ª e 3ª Fotos (Índices 1 e 2)
    // Conforme feedback: 90% das vezes a 1ª é thumbnail, 2ª é Frente, 3ª é Verso.
    if (unique.length >= 3) {
        const pair = [unique[1], unique[2]];
        const analyzed = [await analyzePhoto(pair[0]), await analyzePhoto(pair[1])];
        
        // Se passarem pelo filtro básico, já aceitamos direto
        if (analyzed[0].isFullShot && analyzed[1].isFullShot) {
            console.log("      ✅ Par Padrão [1, 2] Identificado!");
            return [analyzed[0].url, analyzed[1].url];
        }
    }

    // Fallback: Se o par [1, 2] falhar, testamos outros pares padrão ([0,1] e últimos)
    const potentialPairs = [
        [unique[0], unique[1]],
        [unique[unique.length - 2], unique[unique.length - 1]]
    ];

    for (const pair of potentialPairs) {
        if (!pair[0] || !pair[1]) continue;
        const analyzed = [await analyzePhoto(pair[0]), await analyzePhoto(pair[1])];
        if (analyzed[0].isFullShot && analyzed[1].isFullShot) {
            return [analyzed[0].url, analyzed[1].url];
        }
    }

    // Fallback: Estratégia de Score Global em todas para casos complexos
    const analyzed = [];
    for (const url of unique) {
        const res = await analyzePhoto(url);
        if (res.isFullShot) analyzed.push(res);
    }

    if (analyzed.length < 2) {
        return unique.length > 2 ? [unique[1], unique[unique.length - 2]] : [unique[0], unique[unique.length - 1]];
    }

    let bestA, bestB, maxScore = -1;
    for (let i = 0; i < analyzed.length; i++) {
        for (let j = i + 1; j < analyzed.length; j++) {
            const colorDiff = Math.abs(analyzed[i].hash - analyzed[j].hash);
            const contourDiff = Math.abs(analyzed[i].contourHash - analyzed[j].contourHash);
            const posFactor = (i + j) / (analyzed.length * 2);

            // Penalidade de contorno (mesmo vestuário check)
            const contourPenalty = contourDiff > 1000 ? 0.2 :
                contourDiff > 500 ? 0.6 : 1.0;

            const score = colorDiff * (1 + posFactor) * contourPenalty;

            if (score > maxScore) {
                maxScore = score;
                bestA = analyzed[i];
                bestB = analyzed[j];
            }
        }
    }

    return [bestA.url, bestB.url];
}

// ═══════════════════════════════════════════════════════════════
// PROCESSAMENTO DE ÁLBUNS
// ═══════════════════════════════════════════════════════════════
async function processAlbum(albumUrl, teamName, ligaNome, teamSlug, dbTime) {
    const html = await getHTML(albumUrl);
    if (!html) return false;

    // Extrair título
    let title = 'Produto';
    const m = html.match(/data-name="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
    if (m) title = m[1].split('|')[0].trim();

    // Traduzir o nome
    const productName = translateName(title);

    // Fotos frente/verso
    const photos = await getFrontBackPhotos(albumUrl);
    if (photos.length === 0) return false;

    const slug = (productName + '-' + teamName)
        .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 190);

    // V5.9: IMAGE PROXY - Salvar no nosso Storage em vez do link original
    console.log('      📸 Movendo fotos para o Storage...');
    const storagePhotos = [];
    for (let i = 0; i < photos.length; i++) {
        const path = `products/${teamSlug}/${slug}_${i}.jpg`;
        const newUrl = await uploadFromYupoo(photos[i], path);
        if (newUrl) storagePhotos.push(newUrl);
        else storagePhotos.push(photos[i]); // Fallback se falhar
    }

    try {
        const checkProd = await db.query("SELECT id FROM produtos WHERE slug = $1", [slug]);
        if (checkProd.rows.length > 0) {
            await db.query(`
                UPDATE produtos SET 
                    nome = $1, foto_principal = $2, 
                    fotos = ARRAY(SELECT jsonb_array_elements($3::jsonb)), 
                    url_yupoo = $4, ativo = $5
                WHERE id = $6
            `, [productName, storagePhotos[0], JSON.stringify(storagePhotos), albumUrl, true, checkProd.rows[0].id]);
        } else {
            await db.query(`
                INSERT INTO produtos (nome, slug, time_id, foto_principal, fotos, preco_custo, url_yupoo, ativo, criado_em)
                VALUES ($1, $2, $3, $4, ARRAY(SELECT jsonb_array_elements($5::jsonb)), $6, $7, $8, NOW())
            `, [productName, slug, dbTime.id, storagePhotos[0], JSON.stringify(storagePhotos), 50.00, albumUrl, true]);
        }

        // Auto-Sync para Supabase (Lovable) — Usando as fotos JÁ MIGRADAS
        await syncToSupabase(productName, storagePhotos, teamName, ligaNome, dbTime.id, true);
        return true;
    } catch (err) {
        console.error('      ❌ Erro ao salvar produto no banco:', err.message);
        return false;
    }
}

async function getAllAlbumsFromPage(url) {
    let allAlbums = [];
    let currentUrl = url;
    let page = 1;

    while (currentUrl) {
        const html = await getHTML(currentUrl);
        if (!html) break;

        const found = html.match(/\/albums\/(\d+)\?uid=1/g) || [];
        const unique = [...new Set(found)].map(l => `https://minkang.x.yupoo.com${l}`);
        allAlbums.push(...unique);

        // Próxima página
        const next = html.match(/href="([^"]+)"[^>]*class="pagination__next"/);
        if (next) {
            currentUrl = `https://minkang.x.yupoo.com${next[1]}`;
            page++;
        } else {
            currentUrl = null;
        }
    }

    return [...new Set(allAlbums)];
}

// ═══════════════════════════════════════════════════════════════
// SCRAPE BRASILEIRÃO (Time por time)
// ═══════════════════════════════════════════════════════════════
async function scrapeBrasileirao() {
    console.log('\n🇧🇷 ═══ BRASILEIRÃO — Time por Time ═══');

    const catSlug = 'brasileirao';
    let dbCat, dbLiga;

    try {
        const checkCat = await db.query("SELECT id FROM categorias WHERE slug = $1", [catSlug]);
        if (checkCat.rows.length > 0) {
            dbCat = checkCat.rows[0];
        } else {
            const insCat = await db.query("INSERT INTO categorias (nome, slug) VALUES ('BRASILEIRÃO', $1) RETURNING id", [catSlug]);
            dbCat = insCat.rows[0];
        }

        const checkLiga = await db.query("SELECT id FROM ligas WHERE nome = 'BRASILEIRÃO' AND categoria_id = $1", [dbCat.id]);
        if (checkLiga.rows.length > 0) {
            dbLiga = checkLiga.rows[0];
        } else {
            const insLiga = await db.query("INSERT INTO ligas (nome, categoria_id) VALUES ('BRASILEIRÃO', $1) RETURNING id", [dbCat.id]);
            dbLiga = insLiga.rows[0];
        }
    } catch (err) {
        console.error('❌ Erro ao preparar categorias:', err.message);
        return;
    }

    for (const t of BRASILEIRAO_TEAMS) {
        console.log(`\n⚽ ${t.team}`);

        const teamSlug = t.team.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
        
        let dbTime;
        try {
            const checkTime = await db.query("SELECT id FROM times WHERE slug = $1", [teamSlug]);
            if (checkTime.rows.length > 0) {
                dbTime = checkTime.rows[0];
            } else {
                const insTime = await db.query("INSERT INTO times (nome, slug, liga_id) VALUES ($1, $2, $3) RETURNING id", [t.team, teamSlug, dbLiga.id]);
                dbTime = insTime.rows[0];
            }
        } catch (err) {
            console.error(`   ❌ Erro ao salvar time ${t.team}:`, err.message);
            continue;
        }

        const albums = await getAllAlbumsFromPage(t.url);
        console.log(`   📦 ${albums.length} modelos encontrados`);

        let ok = 0;
        for (let i = 0; i < albums.length; i++) {
            process.stdout.write(`   [${i + 1}/${albums.length}] `);
            const success = await processAlbum(albums[i], t.team, 'BRASILEIRÃO', teamSlug, dbTime);
            console.log(success ? '✅' : '❌');
            if (success) ok++;
        }
        console.log(`   ✔ ${ok}/${albums.length} importados`);
    }
}

// ═══════════════════════════════════════════════════════════════
// SCRAPE OUTRAS LIGAS (página geral)
// ═══════════════════════════════════════════════════════════════
function extractTeamFromTitle(title) {
    let name = title.toUpperCase();
    // Limpar sujeira para extrair apenas o time
    name = name.replace(/\b(S-\d*X*L|S-XXL|SIZE[:\s]*\S*)\b/gi, '');
    name = name.replace(/\b\d{2,4}[-\/]\d{2,4}\b/g, '');
    name = name.replace(/\b(19|20)\d{2}\b/g, '');
    name = name.replace(/\b(JERSEY|SHIRT|KIT|HOME|AWAY|THIRD|GOALKEEPER|GK|TRAINING|RETRO|VINTAGE|SPECIAL|EDITION|PLAYER|VERSION|PRE-?MATCH|LONG SLEEVE[D]?|SHORT SLEEVE|WOMEN'?S?|KIDS?|MENS?)\b/gi, '');
    name = name.replace(/&#[xX]27;/g, "'").replace(/&amp;/g, '&');
    name = name.replace(/\b(ALL SPONSOR(S|ED)?|VEST|SHORTS?|POLO|SUIT|JACKET|CROP TOP STYLE|LIFESTYLER|AMERICAN|REVERSIBLE|WINDBREAKER|TERRACE ICONS T-?\s*\w*|SECOND|COMMEMORATIVE)\b/gi, '');
    name = name.replace(/\s*-\s*(RED|BLUE|BLACK|WHITE|BROWN|YELLOW|GREEN|PINK|GREY|PURPLE|GOLD|BEIGE|APRICOT|DARK BLUE|CYAN)\b/gi, '');
    name = name.replace(/#\d+/g, '');
    name = name.replace(/\s{2,}/g, ' ').replace(/^\s*[-–]\s*/, '').replace(/\s*[-–]\s*$/, '').trim();
    return name || 'OUTROS';
}

async function scrapeGenericCategory(catInfo) {
    console.log(`\n🌍 ═══ ${catInfo.name} ═══`);

    const catSlug = catInfo.liga.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-');
    let dbCat, dbLiga;

    try {
        const checkCat = await db.query("SELECT id FROM categorias WHERE slug = $1", [catSlug]);
        if (checkCat.rows.length > 0) {
            dbCat = checkCat.rows[0];
        } else {
            const insCat = await db.query("INSERT INTO categorias (nome, slug) VALUES ($1, $2) RETURNING id", [catInfo.liga, catSlug]);
            dbCat = insCat.rows[0];
        }

        const checkLiga = await db.query("SELECT id FROM ligas WHERE nome = $1 AND categoria_id = $2", [catInfo.liga, dbCat.id]);
        if (checkLiga.rows.length > 0) {
            dbLiga = checkLiga.rows[0];
        } else {
            const insLiga = await db.query("INSERT INTO ligas (nome, categoria_id) VALUES ($1, $2) RETURNING id", [catInfo.liga, dbCat.id]);
            dbLiga = insLiga.rows[0];
        }
    } catch (err) {
        console.error('❌ Erro ao preparar categoria genérica:', err.message);
        return;
    }

    const albums = await getAllAlbumsFromPage(catInfo.url);
    console.log(`   📦 ${albums.length} modelos encontrados`);

    let ok = 0;
    for (let i = 0; i < albums.length; i++) {
        const albumUrl = albums[i];
        const html = await getHTML(albumUrl);
        if (!html) { console.log(`   [${i + 1}/${albums.length}] ❌`); continue; }

        let title = 'Produto';
        const m = html.match(/data-name="([^"]+)"/i) || html.match(/<title>([^<]+)<\/title>/i);
        if (m) title = m[1].split('|')[0].trim();

        const teamName = extractTeamFromTitle(title);
        const teamSlug = teamName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');

        if (!teamSlug || teamSlug.length < 2) { console.log(`   [${i + 1}/${albums.length}] ❌ nome inválido`); continue; }

        let dbTime;
        try {
            const checkTime = await db.query("SELECT id FROM times WHERE slug = $1", [teamSlug]);
            if (checkTime.rows.length > 0) {
                dbTime = checkTime.rows[0];
            } else {
                const insTime = await db.query("INSERT INTO times (nome, slug, liga_id) VALUES ($1, $2, $3) RETURNING id", [teamName, teamSlug, dbLiga.id]);
                dbTime = insTime.rows[0];
            }
        } catch (err) {
            console.error(`   ❌ Erro ao salvar time ${teamName}:`, err.message);
            continue;
        }

        process.stdout.write(`   [${i + 1}/${albums.length}] ${teamName.substring(0, 20)} → `);
        const success = await processAlbum(albumUrl, teamName, catInfo.liga, teamSlug, dbTime);
        console.log(success ? '✅' : '❌');
        if (success) ok++;
    }
    console.log(`   ✔ ${ok}/${albums.length} importados`);
}

// ═══════════════════════════════════════════════════════════════
// VINCULAR PRODUTOS À LOJA
// ═══════════════════════════════════════════════════════════════
async function linkToStore() {
    console.log('\n🏪 Vinculando produtos à loja WZ Sport...');
    try {
        const empresaRes = await db.query("SELECT id FROM empresas WHERE slug = 'wz-sport'");
        const empresa = empresaRes.rows[0];
        if (!empresa) { console.log('❌ Empresa não encontrada'); return; }

        const result = await db.query(`
            INSERT INTO precos_empresas (empresa_id, produto_id, preco_venda, ativo, criado_em)
            SELECT $1, p.id, 89.90, true, NOW()
            FROM produtos p
            WHERE NOT EXISTS (SELECT 1 FROM precos_empresas pe WHERE pe.empresa_id = $1 AND pe.produto_id = p.id)
        `, [empresa.id]);
        console.log(`   ✅ ${result.rowCount} novos produtos vinculados`);
    } catch (err) {
        console.error('❌ Erro ao vincular à loja:', err.message);
    }
}

// ═══════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════
async function main() {
    console.log('🚀 SCRAPER MINKANG V5 — SQL DIRETO');
    console.log('   • Brasileirão: 26 times, cada um com sua página');
    console.log('   • Foto: 2ª e 3ª (regra dos 90%)');
    console.log('   • Conexão: SQL Nativo (Adeus Prisma Error!)');
    console.log('');

    try {
        await db.connect();
        
        await scrapeBrasileirao();

        for (const cat of OTHER_CATEGORIES) {
            await scrapeGenericCategory(cat);
        }

        await linkToStore();

        const totalProd = await db.query("SELECT count(*) FROM produtos");
        const totalTime = await db.query("SELECT count(*) FROM times");
        console.log(`\n═══ RESULTADO FINAL ═══`);
        console.log(`   Produtos: ${totalProd.rows[0].count}`);
        console.log(`   Times: ${totalTime.rows[0].count}`);
        console.log('✅ CONCLUÍDO');
    } catch (err) {
        console.error('ERRO NO FLUXO PRINCIPAL:', err);
    } finally {
        await db.end();
        process.exit(0);
    }
}

main().catch(err => { console.error('ERRO FATAL:', err); process.exit(1); });
