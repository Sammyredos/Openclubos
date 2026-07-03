import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:OpenClub2024@localhost:5432/openclub?schema=public'
  });
  await client.connect();
  
  const res = await client.query('SELECT gender, count(*) FROM "User" GROUP BY gender');
  console.log(res.rows);
  
  await client.end();
}

main().catch(console.error);
