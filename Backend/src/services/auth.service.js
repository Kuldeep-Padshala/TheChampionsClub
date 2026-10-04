const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/db');
const { sendWelcomeEmail, sendOtpEmail } = require('./email.service');

const SALT_ROUNDS = 12;
const OTP_MAX_ATTEMPTS = 5;

// ─── Helpers ────────────────────────────────────────────────

function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateOtp() {
  return String(crypto.randomInt(100000, 999999));
}

async function findUserByIdentifier(identifier) {
  const clean = identifier.trim();
  const [rows] = await pool.execute(
    `SELECT 
       id, 
       full_name as name, 
       email, 
       phone, 
       password_hash, 
       status, 
       must_change_password, 
       failed_login_count, 
       locked_until, 
       last_login_at, 
       (CASE WHEN email_verified_at IS NOT NULL THEN 1 ELSE 0 END) as is_email_verified, 
       created_at, 
       updated_at 
     FROM users 
     WHERE email = ? OR phone = ? 
     LIMIT 1`,
    [clean, clean]
  );
  if (!rows[0]) return null;
  return { ...rows[0], id: String(rows[0].id) };
}

async function findUserById(id) {
  const [rows] = await pool.execute(
    `SELECT 
       id, 
       full_name as name, 
       email, 
       phone, 
       password_hash, 
       status, 
       must_change_password, 
       failed_login_count, 
       locked_until, 
       last_login_at, 
       (CASE WHEN email_verified_at IS NOT NULL THEN 1 ELSE 0 END) as is_email_verified, 
       created_at, 
       updated_at 
     FROM users 
     WHERE id = ? 
     LIMIT 1`,
    [id]
  );
  if (!rows[0]) return null;
  return { ...rows[0], id: String(rows[0].id) };
}

async function getUserRoles(userId) {
  try {
    const [rows] = await pool.query(
      'SELECT r.code FROM user_roles ur JOIN roles r ON ur.role_id = r.id WHERE ur.user_id = ?',
      [userId]
    );
    const codes = rows.map((r) => r.code);
    if (codes.length > 0) return codes;

    // Check if user has an approved or pending membership request
    const [reqs] = await pool.query(
      'SELECT status FROM membership_requests WHERE user_id = ? ORDER BY id DESC LIMIT 1',
      [userId]
    );
    if (reqs.length > 0 && reqs[0].status === 'approved') return ['MEMBER'];
    if (reqs.length > 0 && reqs[0].status === 'pending') return ['APPLICANT'];

    return ['APPLICANT'];
  } catch (err) {
    console.error('[AuthService] Error fetching user roles:', err);
    return ['APPLICANT'];
  }
}

// ─── Register ────────────────────────────────────────────────

async function registerUser(input) {
  const existing = await findUserByIdentifier(input.email);
  if (existing) {
    const error = new Error('Email or phone already in use');
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const [result] = await pool.execute(
    `INSERT INTO users (full_name, email, phone, password_hash, email_verified_at, status, created_at, updated_at) 
     VALUES (?, ?, ?, ?, NOW(), 'active', NOW(), NOW())`,
    [input.name, input.email, input.phone || null, passwordHash]
  );
  const userId = String(result.insertId);

  // Look up requested role from roles table (default: MEMBER)
  const requestedRole = (input.role || 'MEMBER').trim().toUpperCase();

  // If registering as a MEMBER: New user signup requires ADMIN ACCEPTANCE before becoming an active member
  if (requestedRole === 'MEMBER') {
    const [reqResult] = await pool.query(
      `INSERT INTO membership_requests (user_id, full_name, email, phone, date_of_birth, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [userId, input.name, input.email, input.phone || null, input.date_of_birth || null]
    );

    // Broadcast instant real-time notification to all connected admins
    try {
      const { broadcast, sendToRole } = require('./websocket.service');
      broadcast({
        type: 'MEMBERSHIP_REQUEST_CREATED',
        request: {
          id: reqResult.insertId,
          user_id: Number(userId),
          full_name: input.name,
          email: input.email,
          phone: input.phone || null,
          status: 'pending',
          created_at: new Date().toISOString()
        }
      });

      sendToRole('SYSTEM_ADMIN', {
        type: 'NOTIFICATION',
        notification: {
          title: 'New Member Registration',
          body: `${input.name} (${input.email}) has requested club membership. Awaiting your approval.`,
          type: 'membership_request',
          created_at: new Date().toISOString()
        }
      });
      sendToRole('OWNER', {
        type: 'NOTIFICATION',
        notification: {
          title: 'New Member Registration',
          body: `${input.name} has requested club membership. Awaiting admin review.`,
          type: 'membership_request',
          created_at: new Date().toISOString()
        }
      });
    } catch (wsErr) {
      console.warn('[WS Notify error]', wsErr.message);
    }

    sendWelcomeEmail(input.email, input.name).catch((err) =>
      console.error('[Email] Failed to send welcome email:', err.message)
    );

    return {
      id: userId,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      roles: ['APPLICANT'],
      membership_status: 'pending',
      is_pending_approval: true
    };
  }

  // If registering for a staff / other role directly
  const [roleRows] = await pool.query('SELECT id, code FROM roles WHERE code = ?', [requestedRole]);
  const roleId = roleRows.length > 0 ? roleRows[0].id : 8;
  const assignedRoleCode = roleRows.length > 0 ? roleRows[0].code : requestedRole;

  try {
    await pool.query('INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES (?, ?, NOW())', [userId, roleId]);
  } catch (e) {
    console.error('[AuthService] Could not assign role:', e);
  }

  sendWelcomeEmail(input.email, input.name).catch((err) =>
    console.error('[Email] Failed to send welcome email:', err.message)
  );

  return { id: userId, name: input.name, email: input.email, phone: input.phone || null, roles: [assignedRoleCode] };
}

// ─── Login ────────────────────────────────────────────────

async function loginUser(input) {
  const user = await findUserByIdentifier(input.email);

  // Check if account status allows login (active only)
  if (user && user.status && user.status !== 'active') {
    const error = new Error(`Your account status is ${user.status}. Please contact the concierge desk.`);
    error.statusCode = 403;
    throw error;
  }

  // Check if account is temporarily locked
  if (user && user.locked_until && new Date(user.locked_until) > new Date()) {
    const unlockTime = new Date(user.locked_until).toLocaleTimeString();
    const error = new Error(`Account temporarily locked due to multiple failed login attempts. Try again after ${unlockTime}.`);
    error.statusCode = 423;
    throw error;
  }

  const dummyHash = '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const hashToCompare = user?.password_hash || dummyHash;

  const isValid = await bcrypt.compare(input.password, hashToCompare);

  if (!user || !isValid || !user.password_hash) {
    if (user) {
      await pool.execute(
        `UPDATE users 
         SET failed_login_count = failed_login_count + 1,
             locked_until = CASE WHEN failed_login_count + 1 >= 5 THEN DATE_ADD(NOW(), INTERVAL 15 MINUTE) ELSE locked_until END 
         WHERE id = ?`,
        [user.id]
      );
    }
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  // Reset failed login counter, clear lock, and update last_login_at
  await pool.execute(
    'UPDATE users SET failed_login_count = 0, locked_until = NULL, last_login_at = NOW(), updated_at = NOW() WHERE id = ?',
    [user.id]
  );

  const roles = await getUserRoles(user.id);
  const [pendingReq] = await pool.query(
    "SELECT id, status, created_at FROM membership_requests WHERE user_id = ? AND status = 'pending' LIMIT 1",
    [user.id]
  );
  const isPending = pendingReq.length > 0;
  return { 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    phone: user.phone, 
    roles,
    is_pending_approval: isPending,
    membership_status: isPending ? 'pending' : (roles.includes('MEMBER') ? 'active' : 'none')
  };
}

// ─── Forgot Password / OTP ────────────────────────────────────────────────

async function requestPasswordReset(email) {
  const user = await findUserByIdentifier(email);
  if (!user) {
    const error = new Error('No user found with this email address');
    error.statusCode = 404;
    throw error;
  }

  await pool.execute(
    'UPDATE password_reset_otps SET used = 1 WHERE user_id = ? AND used = 0',
    [user.id]
  );

  const otp = generateOtp();
  const otpHash = hashOtp(otp);

  await pool.execute(
    'INSERT INTO password_reset_otps (id, user_id, otp_hash, expires_at) VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))',
    [uuidv4(), user.id, otpHash]
  );

  await sendOtpEmail(user.email, otp);
}

async function resetPassword(email, otp, newPassword) {
  const user = await findUserByIdentifier(email);
  if (!user) {
    const error = new Error('Invalid or expired code');
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(
    'SELECT * FROM password_reset_otps WHERE user_id = ? AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    [user.id]
  );

  const otpRecord = rows[0];
  if (!otpRecord) {
    const error = new Error('Invalid or expired code');
    error.statusCode = 400;
    throw error;
  }

  if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
    const error = new Error('Too many failed attempts. Please request a new code.');
    error.statusCode = 429;
    throw error;
  }

  const otpHash = hashOtp(otp);
  if (otpHash !== otpRecord.otp_hash) {
    await pool.execute(
      'UPDATE password_reset_otps SET attempts = attempts + 1 WHERE id = ?',
      [otpRecord.id]
    );
    const remaining = OTP_MAX_ATTEMPTS - (otpRecord.attempts + 1);
    const error = new Error(
      remaining > 0 ? `Invalid code. ${remaining} attempt(s) remaining.` : 'Too many failed attempts. Please request a new code.'
    );
    error.statusCode = 400;
    throw error;
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.execute('UPDATE users SET password_hash = ?, updated_at = NOW() WHERE id = ?', [newHash, user.id]);
  await pool.execute('UPDATE password_reset_otps SET used = 1 WHERE id = ?', [otpRecord.id]);
  await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [user.id]);
}

// ─── Google OAuth (Users Table Directly) ──────────────────────────────────

async function handleGoogleOAuth(googleUser) {
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
            `INSERT INTO members (user_id, member_code, qr_token, full_name, phone, email, date_of_birth, status, joined_on, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, '1995-01-01', 'active', CURDATE(), NOW(), NOW())`,
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
    `INSERT INTO users (full_name, email, password_hash, email_verified_at, status, created_at, updated_at) 
     VALUES (?, ?, ?, NOW(), 'active', NOW(), NOW())`,
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
      `INSERT INTO membership_requests (user_id, full_name, email, phone, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'pending', NOW(), NOW())`,
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
        body: `${googleUser.name} (${googleUser.email}) has requested club membership. Awaiting your approval.`,
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

async function getUserById(id) {
  const user = await findUserById(id);
  if (!user) return null;
  const roles = await getUserRoles(user.id);
  const [pendingReq] = await pool.query(
    "SELECT id, status, created_at FROM membership_requests WHERE user_id = ? AND status = 'pending' LIMIT 1",
    [user.id]
  );
  const isPending = pendingReq.length > 0;
  return { 
    id: user.id, 
    name: user.name, 
    email: user.email, 
    phone: user.phone, 
    roles,
    is_pending_approval: isPending,
    membership_status: isPending ? 'pending' : (roles.includes('MEMBER') ? 'active' : 'none')
  };
}

module.exports = {
  findUserByIdentifier,
  findUserById,
  getUserRoles,
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  handleGoogleOAuth,
  getUserById,
};
