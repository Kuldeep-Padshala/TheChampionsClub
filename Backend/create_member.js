const {pool} = require('./src/config/db.js');
const bcrypt = require('bcrypt');
async function run() {
  try {
    const hash = await bcrypt.hash('Password@123', 10);
    const [existing] = await pool.query("SELECT id FROM users WHERE email = 'new.member@example.com'");
    if (existing.length > 0) {
      console.log('User already exists');
      process.exit(0);
    }
    await pool.query("INSERT INTO users (name, email, password_hash, role) VALUES ('Rohan Gupta', 'new.member@example.com', ?, 'MEMBER')", [hash]);
    const [res] = await pool.query('SELECT LAST_INSERT_ID() as id');
    const userId = res[0].id;
    await pool.query("INSERT INTO members (user_id, member_code, qr_token, full_name, email, status) VALUES (?, 'MEM-2394', 'QR-999', 'Rohan Gupta', 'new.member@example.com', 'active')", [userId]);
    console.log('Done!');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
run();
