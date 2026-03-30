/**
 * Corrige os produtos antigos que ficaram com "Produto Sem Nome"
 * Usa o catalog.json como fonte de verdade para os nomes
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function fixNames() {
    console.log('🔧 Corrigindo nomes dos produtos antigos...');
    
    const catalog = JSON.parse(fs.readFileSync('d:/crm-camisas-tailandesas/img/catalog.json', 'utf8'));
    
    // Criar mapa: source_url -> album info
    const photoMap = {};
    const albums = {};
    for (const item of catalog.items) {
        photoMap[item.source_url] = item;
        if (!albums[item.album_url]) {
            albums[item.album_url] = item;
        }
    }
    
    // Buscar produtos com nome genérico
    const badProducts = await prisma.produto.findMany({
        where: { nome: 'Produto Sem Nome' },
        select: { id: true, nome: true, foto_principal: true, fotos: true }
    });
    
    console.log(`📋 ${badProducts.length} produtos com "Produto Sem Nome" encontrados`);
    
    let fixed = 0;
    for (const prod of badProducts) {
        // Tentar encontrar no catalog.json pela foto_principal
        const match = photoMap[prod.foto_principal];
        if (match) {
            const newName = match.formatted_name || match.name || match.original_title;
            await prisma.produto.update({
                where: { id: prod.id },
                data: { nome: newName }
            });
            fixed++;
        } else {
            // Tentar pelas fotos do array
            let found = false;
            for (const foto of (prod.fotos || [])) {
                const m = photoMap[foto];
                if (m) {
                    const newName = m.formatted_name || m.name || m.original_title;
                    await prisma.produto.update({
                        where: { id: prod.id },
                        data: { nome: newName }
                    });
                    fixed++;
                    found = true;
                    break;
                }
            }
            if (!found) {
                console.log(`  ⚠️ Não encontrado match para produto ${prod.id} (foto: ${prod.foto_principal?.substring(0,50)})`);
            }
        }
    }
    
    console.log(`\n✅ ${fixed} de ${badProducts.length} nomes corrigidos!`);
    
    // Verificar resultado
    const remaining = await prisma.produto.count({ where: { nome: 'Produto Sem Nome' }});
    console.log(`📊 Restantes com "Produto Sem Nome": ${remaining}`);
    
    await prisma.$disconnect();
}

fixNames().catch(e => { console.error(e); process.exit(1); });
