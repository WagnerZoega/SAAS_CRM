const { PrismaClient } = require('@prisma/client');

async function test() {
    // Password: !WOwFsnVm7q:[PGn4IR2qoI5i|*r
    // Encoded: %21WOwFsnVm7q%3A%5BPGn4IR2qoI5i%7C%2Ar
    const url = "postgresql://postgres:%21WOwFsnVm7q%3A%5BPGn4IR2qoI5i%7C%2Ar@poker.c548oskckol3.sa-east-1.rds.amazonaws.com:5432/postgres?sslmode=require";
    
    process.env.DATABASE_URL = url;
    console.log("Testing new credentials from Secrets Manager...");
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        console.log("✅ PERFECT! THE PASSWORD WORKS!");
        // Check if saas_crm database exists or use postgres for now
        await prisma.$disconnect();
        process.exit(0);
    } catch (e) {
        console.log(`❌ STILL FAILING: ${e.message}`);
        process.exit(1);
    }
}

test();
