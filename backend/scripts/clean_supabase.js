const { PrismaClient } = require('@prisma/client');

async function cleanDB() {
    const prisma = new PrismaClient();
    console.log("Cleaning up conflicting tables in Supabase...");
    const tables = [
        'precos_empresas', 'pedidos', 'clientes', 'produtos', 'times', 
        'ligas', 'categorias', 'empresas', 'noticias_futebol', 'pagamentos', 'whatsapp_instancias'
    ];

    for (const table of tables) {
        try {
            await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."${table}" CASCADE;`);
            console.log(`Dropped ${table}`);
        } catch (e) {
            console.log(`Error dropping ${table}: ${e.message}`);
        }
    }
    await prisma.$disconnect();
    console.log("Cleanup finished.");
}

cleanDB();
