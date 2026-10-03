const mysql = require('mysql2/promise');

async function run() {
  const conn = await mysql.createConnection({
    host: 'mysql-7d3f055-vibhushihora1107-2a3a.i.aivencloud.com',
    port: 21561,
    user: 'avnadmin',
    password: 'AVNS_kjt4q6CY7KTYvQlWLxB',
    database: 'defaultdb',
    ssl: { rejectUnauthorized: false }
  });

  console.log('Connected to Aiven. Creating auth tables...');

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
  console.log('✓ Created table: refresh_tokens');

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
  console.log('✓ Created table: password_reset_otps');

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
  console.log('✓ Created table: accounts');

  const [res] = await conn.query('SHOW TABLES LIKE "%token%"');
  console.log('Verified tables:', res);

  await conn.end();
}

run().catch((e) => {
  console.error('Migration error:', e);
});
