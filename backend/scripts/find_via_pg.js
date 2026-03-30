const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres:postgres@localhost:5432/saas_crm"
});

async function findId() {
  await client.connect();
  const res = await client.query("SELECT id, nome FROM times WHERE nome ILIKE '%Paranaense%' LIMIT 1");
  console.log(JSON.stringify(res.rows[0]));
  await client.end();
}

findId();
