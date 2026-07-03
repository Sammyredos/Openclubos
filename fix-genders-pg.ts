import { Client } from 'pg';

async function main() {
  const client = new Client({
    connectionString: 'postgresql://postgres:OpenClub2024@localhost:5432/openclub?schema=public'
  });
  await client.connect();
  
  // Set half to MALE and half to FEMALE for any null genders
  const res = await client.query('SELECT id FROM "User" WHERE gender IS NULL');
  const users = res.rows;
  
  let males = 0;
  let females = 0;
  for (let i = 0; i < users.length; i++) {
    const gender = i % 2 === 0 ? 'MALE' : 'FEMALE';
    await client.query('UPDATE "User" SET gender = $1 WHERE id = $2', [gender, users[i].id]);
    if (gender === 'MALE') males++;
    else females++;
  }
  
  console.log(`Updated ${males} males and ${females} females.`);
  await client.end();
}

main().catch(console.error);
