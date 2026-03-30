const { Client } = require('pg');

async function createDb() {
    // Connect to postgres default DB to create the new one
    const config = {
        user: 'postgres',
        password: '!WOwFsnVm7q:[PGn4IR2qoI5i|*r',
        host: 'poker.c548oskckol3.sa-east-1.rds.amazonaws.com',
        port: 5432,
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    };

    const client = new Client(config);

    try {
        await client.connect();
        console.log("Connected to RDS. Checking if 'saas_crm' exists...");
        
        const res = await client.query("SELECT 1 FROM pg_database WHERE datname = 'saas_crm'");
        if (res.rowCount === 0) {
            console.log("Creating database 'saas_crm'...");
            // CREATE DATABASE cannot run inside a transaction
            await client.query("CREATE DATABASE saas_crm");
            console.log("✅ Database 'saas_crm' created successfully!");
        } else {
            console.log("⚠️ Database 'saas_crm' already exists.");
        }
    } catch (err) {
        console.error("❌ Error:", err.message);
    } finally {
        await client.end();
    }
}

createDb();
