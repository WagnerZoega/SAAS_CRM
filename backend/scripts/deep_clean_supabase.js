const { PrismaClient } = require('@prisma/client');

async function totalWipe() {
    const prisma = new PrismaClient();
    console.log("Resilient cleaning public schema in Supabase...");
    
    // Lista de tabelas identificadas no erro
    const objectsToDrop = [
        'wzbot_dashboard', 'wzbot_logs', 'wzbot', 'chatbot', 'chat_history'
    ];

    for (const obj of objectsToDrop) {
        try {
            await prisma.$executeRawUnsafe(`DROP VIEW IF EXISTS "public"."${obj}" CASCADE;`);
            console.log(`View ${obj} handled.`);
        } catch (e) {}

        try {
            await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "public"."${obj}" CASCADE;`);
            console.log(`Table ${obj} handled.`);
        } catch (e) {}
    }

    await prisma.$disconnect();
    console.log("Cleanup attempt finished.");
}

totalWipe();
