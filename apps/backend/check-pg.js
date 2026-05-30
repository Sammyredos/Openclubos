const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:OpenClub2024@localhost:5432/openclub?schema=public' });
pool.query("SELECT email, \"emailVerified\", \"emailVerificationToken\", \"emailVerificationExpires\" FROM \"User\" WHERE email = 'admin@oakwoodly.com'", (err, res) => {
  console.log(err ? err.stack : res.rows);
  pool.end();
});
