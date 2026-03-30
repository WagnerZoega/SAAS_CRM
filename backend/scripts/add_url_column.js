const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addColumn() {
    try {
        await prisma.$executeRawUnsafe(`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS url_yupoo VARCHAR(500);`);
        console.log("Coluna url_yupoo adicionada ou já existente.");
    } catch (e) {
        console.error("Erro ao adicionar coluna:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

addColumn();
