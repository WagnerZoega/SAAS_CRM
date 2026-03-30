const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const DETAIL_PATTERNS = [
    '/label/', '/logo/', '/detail/', '/washing/', '/neck/', '/sleeve/', '_detail', '_label', 'logo.jpg', 'label.jpg', 'tags.jpg'
];

async function main() {
    console.log('🚀 Iniciando Nuke de Fotos de Detalhe...\n');

    const produtos = await prisma.produto.findMany({
        where: {
            OR: DETAIL_PATTERNS.map(p => ({ foto_principal: { contains: p, mode: 'insensitive' } }))
        }
    });

    console.log(`🔍 Encontrados ${produtos.length} produtos com possíveis fotos de detalhe.`);

    let deletados = 0;
    let corrigidos = 0;

    for (const p of produtos) {
        // Tentar encontrar uma foto melhor na galeria
        const validPhotos = p.fotos.filter(f => !DETAIL_PATTERNS.some(dp => f.toLowerCase().includes(dp)));

        if (validPhotos.length > 0) {
            // Se encontrou uma foto válida, atualiza
            await prisma.produto.update({
                where: { id: p.id },
                data: { foto_principal: validPhotos[0] }
            });
            corrigidos++;
        } else {
            // Se NÃO tem foto válida, nuka o produto
            await prisma.precoEmpresa.deleteMany({ where: { produto_id: p.id } });
            await prisma.produto.delete({ where: { id: p.id } });
            deletados++;
        }
    }

    console.log(`\n✅ Resultado:`);
    console.log(`✨ Corrigidos (foto principal trocada): ${corrigidos}`);
    console.log(`🗑️ Deletados (sem fotos válidas): ${deletados}`);

    await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
