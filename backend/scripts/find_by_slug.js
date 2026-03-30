const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: [] });

(async () => {
    try {
        const prod = await prisma.$queryRawUnsafe(`
            SELECT id, nome, fotos, slug
            FROM produtos 
            WHERE slug LIKE '%1994-titular-retro%' 
            LIMIT 5
        `);
        console.log(JSON.stringify(prod, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
})();
