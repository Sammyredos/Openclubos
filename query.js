const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://postgres:OpenClub2024@localhost:5432/openclub?schema=public' });

async function run() {
  await client.connect();
  // Find duplicates
  const res = await client.query(`
    SELECT id, name, "createdAt" 
    FROM "Tournament" 
    WHERE name = 'Major Championship (4-Day, 200+ Players)'
    ORDER BY "createdAt" ASC
  `);
  
  if (res.rows.length > 1) {
    const idsToDelete = res.rows.slice(1).map(r => r.id);
    for (const id of idsToDelete) {
      console.log('Deleting duplicate tournament:', id);
      // Delete registrations first if any
      await client.query('DELETE FROM "Registration" WHERE "tournamentId" = $1', [id]);
      await client.query('DELETE FROM "Group" WHERE "tournamentId" = $1', [id]);
      await client.query('DELETE FROM "Tournament" WHERE id = $1', [id]);
    }
    console.log('Deleted successfully.');
  } else {
    console.log('No duplicates found.');
  }
  await client.end();
}

run().catch(console.error);
