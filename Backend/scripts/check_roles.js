require('../src/config/env');
const { pool } = require('../src/config/db');

async function check() {
  const [roles] = await pool.query('SELECT * FROM roles');
  console.log('--- ALL ROLES ---');
  console.table(roles);

  const [allUsersWithRoles] = await pool.query(`
    SELECT u.id, u.full_name, u.email, u.status, r.id as role_id, r.code as role_code, r.name as role_name
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    ORDER BY u.id
  `);
  console.log('--- ALL USERS WITH ROLES ---');
  console.table(allUsersWithRoles);

  process.exit(0);
}

check().catch(console.error);
