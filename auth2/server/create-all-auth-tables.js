const mysql = require('mysql2/promise');

async function main() {
  const conn = await mysql.createConnection({
    host: 'mysql-7d3f055-vibhushihora1107-2a3a.i.aivencloud.com',
    port: 21561,
    user: 'avnadmin',
    password: 'AVNS_kjt4q6CY7KTYvQlWLxB',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
  });

  console.log('--- Ensuring users table has proper columns ---');
  // Check if users exists and columns
  const [userCols] = await conn.query('SHOW COLUMNS FROM users');
  const colNames = userCols.map(c => c.Field);
  console.log('Users columns:', colNames);

  if (!colNames.includes('name')) {
    await conn.query('ALTER TABLE users ADD COLUMN name VARCHAR(255) NULL AFTER full_name');
    console.log('Added column `name` to users');
  }

  if (!colNames.includes('is_email_verified')) {
    await conn.query('ALTER TABLE users ADD COLUMN is_email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER password_hash');
    console.log('Added column `is_email_verified` to users');
  }

  console.log('\n--- Creating refresh_tokens ---');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      token_hash VARCHAR(64) NOT NULL UNIQUE,
      expires_at DATETIME NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_rt_user_id (user_id),
      INDEX idx_rt_hash (token_hash)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ refresh_tokens ready');

  console.log('\n--- Creating password_reset_otps ---');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS password_reset_otps (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      otp_hash VARCHAR(64) NOT NULL,
      expires_at DATETIME NOT NULL,
      attempts TINYINT NOT NULL DEFAULT 0,
      used TINYINT(1) NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_otp_user_id (user_id),
      INDEX idx_otp_lookup (user_id, used, expires_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ password_reset_otps ready');

  console.log('\n--- Creating accounts ---');
  await conn.query(`
    CREATE TABLE IF NOT EXISTS accounts (
      id VARCHAR(36) NOT NULL PRIMARY KEY,
      user_id VARCHAR(64) NOT NULL,
      provider ENUM('google') NOT NULL,
      provider_id VARCHAR(255) NOT NULL,
      provider_email VARCHAR(255) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_provider_account (provider, provider_id),
      INDEX idx_accounts_user_id (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('✓ accounts ready');

  // Verify all 4
  const [u] = await conn.query('SELECT COUNT(*) as c FROM users');
  const [rt] = await conn.query('SELECT COUNT(*) as c FROM refresh_tokens');
  const [otp] = await conn.query('SELECT COUNT(*) as c FROM password_reset_otps');
  const [acc] = await conn.query('SELECT COUNT(*) as c FROM accounts');
  console.log('\nFinal Table Verification:');
  console.log({
    users: u[0].c,
    refresh_tokens: rt[0].c,
    password_reset_otps: otp[0].c,
    accounts: acc[0].c
  });

  await conn.end();
}

main().catch(console.error);
