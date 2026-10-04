const { pool } = require('./Backend/src/config/db');
async function run() {
  const [users] = await pool.query(`
    SELECT u.id, u.email, GROUP_CONCAT(r.code) as roles
    FROM users u
    LEFT JOIN user_roles ur ON u.id = ur.user_id
    LEFT JOIN roles r ON ur.role_id = r.id
    GROUP BY u.id, u.email
  `);
  console.log(JSON.stringify(users, null, 2));
  process.exit(0);
}
run();
