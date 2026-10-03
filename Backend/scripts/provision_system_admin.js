require('../src/config/env');
const { pool } = require('../src/config/db');
const bcrypt = require('bcrypt');

async function provision() {
  console.log('--- Provisioning SYSTEM_ADMIN role and user ---');

  // 1. Check or insert SYSTEM_ADMIN role
  const [existingRole] = await pool.query('SELECT * FROM roles WHERE code = ?', ['SYSTEM_ADMIN']);
  let roleId;
  if (existingRole.length > 0) {
    roleId = existingRole[0].id;
    console.log('SYSTEM_ADMIN role already exists with ID:', roleId);
  } else {
    const [maxIdRows] = await pool.query('SELECT COALESCE(MAX(id), 0) as max_id FROM roles');
    const newId = Number(maxIdRows[0].max_id) + 1;
    await pool.query(
      'INSERT INTO roles (id, code, name, description) VALUES (?, ?, ?, ?)',
      [newId, 'SYSTEM_ADMIN', 'System Administrator', 'Maintains system health, user access, security permissions, and operational settings']
    );
    roleId = newId;
    console.log('Created SYSTEM_ADMIN role with ID:', roleId);
  }

  // 2. Grant all permissions to SYSTEM_ADMIN
  const [allPerms] = await pool.query('SELECT id, code FROM permissions');
  console.log('Total permissions in system:', allPerms.length);
  for (const perm of allPerms) {
    await pool.query(
      'INSERT IGNORE INTO role_permissions (role_id, permission_id, permission_code) VALUES (?, ?, ?)',
      [roleId, perm.id, perm.code]
    ).catch(() => {});
  }
  console.log('Granted permissions to SYSTEM_ADMIN');

  // 3. Create or update admin@championsclub.example user
  const passwordHash = await bcrypt.hash('Password@123', 10);
  const [existingUser] = await pool.query('SELECT * FROM users WHERE email = ?', ['admin@championsclub.example']);
  let adminUserId;

  if (existingUser.length > 0) {
    adminUserId = existingUser[0].id;
    await pool.query(
      'UPDATE users SET password_hash = ?, status = ?, locked_until = NULL, failed_login_count = 0 WHERE id = ?',
      [passwordHash, 'active', adminUserId]
    );
    console.log('Updated existing admin user ID:', adminUserId);
  } else {
    const [userRes] = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      ['Vikram Batra', 'admin@championsclub.example', '+91 98200 99999', passwordHash, 'active']
    );
    adminUserId = userRes.insertId;
    console.log('Created new admin user ID:', adminUserId);
  }

  // 4. Assign SYSTEM_ADMIN role to user
  await pool.query(
    'INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)',
    [adminUserId, roleId]
  );
  console.log('Assigned SYSTEM_ADMIN role to admin user');

  // Verify
  const [userRoles] = await pool.query(`
    SELECT u.id, u.full_name, u.email, u.status, r.code as role_code, r.name as role_name
    FROM users u
    JOIN user_roles ur ON u.id = ur.user_id
    JOIN roles r ON ur.role_id = r.id
    WHERE u.id = ?
  `, [adminUserId]);
  console.log('Verification:', userRoles);

  process.exit(0);
}

provision().catch(console.error);
