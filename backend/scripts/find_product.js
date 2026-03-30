const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ log: [] });

(async () => {
    try {
        const prod = await prisma.$queryRawUnsafe(`
            SELECT id, nome, fotos, url_yupoo 
            FROM produtos 
            WHERE nome ILIKE '%Flamengo 1994 Titular Retrô%' 
            LIMIT 1
        `);
        console.log(JSON.stringify(prod));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
        process.exit(0);
    }
})();
