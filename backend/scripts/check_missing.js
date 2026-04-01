const { Client } = require('pg');
require('dotenv').config({ path: 'd:/SAAS_CRM/backend/.env' });

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function check() {
    try {
        await client.connect();
        const res = await client.query(`
            SELECT p.nome, p.fotos, t.nome as time_nome
            FROM produtos p
            LEFT JOIN times t ON p.time_id = t.id
            WHERE (p.fotos IS NULL OR p.fotos = '[]' OR p.fotos = 'null')
            AND p.ativo = true
            LIMIT 20
        `);
        
        console.log("--- PRODUTOS SEM FOTOS NO BANCO LOCAL ---");
        res.rows.forEach(r => {
            console.log(`Time: ${r.time_nome || 'N/A'} | Produto: ${r.nome}`);
        });
        
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

check();
