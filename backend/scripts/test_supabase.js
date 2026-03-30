const { PrismaClient } = require('@prisma/client');

async function testSupabase() {
    console.log("Testing Supabase connection...");
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        console.log("✅ SUCCESS! Connected to Supabase.");
        const tables = await prisma.$queryRaw`SELECT tablename FROM pg_catalog.pg_tables WHERE schemaname = 'public'`;
        console.log("Tables found:", tables);
        await prisma.$disconnect();
        process.exit(0);
    } catch (e) {
        console.error("❌ FAILED:", e.message);
        process.exit(1);
    }
}

testSupabase();
