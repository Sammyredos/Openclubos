const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:OpenClub2024@localhost:5432/openclub?schema=public'
  });
  await client.connect();

  const res = await client.query(`SELECT id, name, "enableCut", "cutAfterRound" FROM "Tournament" WHERE name LIKE '%OpenClub 3-Day Championship 64%'`);
  console.log(res.rows);

  await client.end();
}
main();
