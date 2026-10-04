const fs = require('fs');
const file = 'k:\\Kuldeep\\Odoo FInale\\TheChampionsClub\\Backend\\src\\services\\auth.service.js';
let content = fs.readFileSync(file, 'utf8');

const targetFnStr = `async function handleGoogleOAuth(googleUser) {`;
const startIdx = content.indexOf(targetFnStr);
const endIdx = content.indexOf('async function getUserById(id)', startIdx);

const newFn = `async function handleGoogleOAuth(googleUser) {
  const existingUser = await findUserByIdentifier(googleUser.email);

  if (existingUser) {
    await pool.execute(
      'UPDATE users SET last_login_at = NOW(), email_verified_at = COALESCE(email_verified_at, NOW()), updated_at = NOW() WHERE id = ?',
      [existingUser.id]
    );
    let roles = await getUserRoles(existingUser.id);
    
    // If no roles, assume they need to go through the APPLICANT flow
    if (!roles || roles.length === 0) {
      try {
        const [roleRows] = await pool.query("SELECT id FROM roles WHERE code = 'APPLICANT' OR name = 'Applicant' LIMIT 1");
        const roleId = roleRows.length > 0 ? roleRows[0].id : null;
        if (roleId) {
          await pool.query('INSERT IGNORE INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, NOW())', [existingUser.id, roleId]);
          roles = ['APPLICANT'];
        }
      } catch (e) {
        console.error('[Google OAuth] Assign role error:', e.message);
      }
    }
    
    // Only ensure member profile exists if they are an active MEMBER or higher, NOT if they are just an APPLICANT
    if (roles.includes('MEMBER') || roles.includes('SYSTEM_ADMIN') || roles.includes('OWNER')) {
      try {
        const [memRows] = await pool.query('SELECT id FROM members WHERE user_id = ? OR email = ? LIMIT 1', [existingUser.id, googleUser.email]);
        if (memRows.length === 0) {
          const memberCode = 'CC-2026-' + Math.floor(1000 + Math.random() * 9000);
          const qrToken = 'QR-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7).toUpperCase();
          const phone = existingUser.phone || ('+91-9' + Math.floor(100000000 + Math.random() * 900000000));
          await pool.query(
            \`INSERT INTO members (user_id, member_code, qr_token, full_name, phone, email, date_of_birth, status, joined_on, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, '1995-01-01', 'active', CURDATE(), NOW(), NOW())\`,
            [existingUser.id, memberCode, qrToken, existingUser.name || googleUser.name, phone, googleUser.email]
          );
        } else {
          await pool.query('UPDATE members SET user_id = ? WHERE id = ? AND (user_id IS NULL OR user_id = 0)', [existingUser.id, memRows[0].id]);
        }
      } catch (memErr) {
        console.warn('[Google OAuth] Ensure member note:', memErr.message);
      }
    }

    return { id: existingUser.id, name: existingUser.name, email: existingUser.email, isNew: false, roles };
  }

  // Create new user directly in users table
  const dummyPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), SALT_ROUNDS);
  const [result] = await pool.execute(
    \`INSERT INTO users (full_name, email, password_hash, email_verified_at, status, created_at, updated_at) 
     VALUES (?, ?, ?, NOW(), 'active', NOW(), NOW())\`,
    [googleUser.name, googleUser.email, dummyPasswordHash]
  );
  const userId = String(result.insertId);

  // Assign APPLICANT role dynamically
  try {
    const [roleRows] = await pool.query("SELECT id FROM roles WHERE code = 'APPLICANT' OR name = 'Applicant' LIMIT 1");
    const roleId = roleRows.length > 0 ? roleRows[0].id : null;
    if (roleId) {
      await pool.query('INSERT IGNORE INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, NOW())', [userId, roleId]);
    }
  } catch (e) {
    console.error('[AuthService] Could not assign default applicant role:', e);
  }

  // Create membership_requests entry for new Google users
  try {
    const [reqResult] = await pool.query(
      \`INSERT INTO membership_requests (user_id, full_name, email, phone, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())\`,
      [userId, googleUser.name, googleUser.email, null]
    );

    const { broadcast, sendToRole } = require('./websocket.service');
    broadcast({
      type: 'MEMBERSHIP_REQUEST_CREATED',
      request: {
        id: reqResult.insertId,
        user_id: Number(userId),
        full_name: googleUser.name,
        email: googleUser.email,
        phone: null,
        status: 'pending',
        created_at: new Date().toISOString()
      }
    });

    sendToRole('SYSTEM_ADMIN', {
      type: 'NOTIFICATION',
      notification: {
        title: 'New Member Registration via Google',
        body: \`\${googleUser.name} (\${googleUser.email}) has requested club membership. Awaiting your approval.\`,
        type: 'membership_request',
        created_at: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error('[Google OAuth] Applicant request creation note:', err.message);
  }

  sendWelcomeEmail(googleUser.email, googleUser.name).catch((err) =>
    console.error('[Email] Failed to send welcome email:', err.message)
  );

  return { id: userId, name: googleUser.name, email: googleUser.email, isNew: true, roles: ['APPLICANT'] };
}

`;

content = content.substring(0, startIdx) + newFn + content.substring(endIdx);
fs.writeFileSync(file, content);
console.log("Patched auth.service.js successfully");
