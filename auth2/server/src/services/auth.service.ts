import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { pool } from '../config/db';
import { sendWelcomeEmail, sendOtpEmail } from './email.service';
import type { User } from '../types';

const SALT_ROUNDS = 12;
const OTP_MAX_ATTEMPTS = 5;
const OTP_EXPIRY_MINUTES = 10;

// ─── Helpers ────────────────────────────────────────────────

function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex');
}

function generateOtp(): string {
  return String(crypto.randomInt(100000, 999999));
}

async function findUserByEmail(email: string): Promise<User | null> {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE email = ? LIMIT 1',
    [email]
  ) as [User[], any];
  return rows[0] || null;
}

async function findUserById(id: string): Promise<User | null> {
  const [rows] = await pool.execute(
    'SELECT * FROM users WHERE id = ? LIMIT 1',
    [id]
  ) as [User[], any];
  return rows[0] || null;
}

// ─── Register ────────────────────────────────────────────────

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

export async function registerUser(input: RegisterInput): Promise<{ id: string; name: string; email: string }> {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    const error = new Error('Email already in use') as any;
    error.statusCode = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
  const userId = uuidv4();

  await pool.execute(
    'INSERT INTO users (id, name, email, password_hash) VALUES (?, ?, ?, ?)',
    [userId, input.name, input.email, passwordHash]
  );

  sendWelcomeEmail(input.email, input.name).catch((err) =>
    console.error('[Email] Failed to send welcome email:', err.message)
  );

  return { id: userId, name: input.name, email: input.email };
}

// ─── Login ────────────────────────────────────────────────

export interface LoginInput {
  email: string;
  password: string;
}

export async function loginUser(input: LoginInput): Promise<{ id: string; name: string; email: string }> {
  const user = await findUserByEmail(input.email);

  const dummyHash = '$2b$12$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
  const hashToCompare = user?.password_hash || dummyHash;

  const isValid = await bcrypt.compare(input.password, hashToCompare);

  if (!user || !isValid || !user.password_hash) {
    const error = new Error('Invalid email or password') as any;
    error.statusCode = 401;
    throw error;
  }

  return { id: user.id, name: user.name, email: user.email };
}

// ─── Forgot Password / OTP ────────────────────────────────────────────────

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('No account found with this email address') as any;
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

export async function resetPassword(email: string, otp: string, newPassword: string): Promise<void> {
  const user = await findUserByEmail(email);
  if (!user) {
    const error = new Error('Invalid or expired code') as any;
    error.statusCode = 400;
    throw error;
  }

  const [rows] = await pool.execute(
    'SELECT * FROM password_reset_otps WHERE user_id = ? AND used = 0 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
    [user.id]
  ) as [any[], any];

  const otpRecord = rows[0];
  if (!otpRecord) {
    const error = new Error('Invalid or expired code') as any;
    error.statusCode = 400;
    throw error;
  }

  if (otpRecord.attempts >= OTP_MAX_ATTEMPTS) {
    const error = new Error('Too many failed attempts. Please request a new code.') as any;
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
    ) as any;
    error.statusCode = 400;
    throw error;
  }

  const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, user.id]);
  await pool.execute('UPDATE password_reset_otps SET used = 1 WHERE id = ?', [otpRecord.id]);
  await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [user.id]);
}

// ─── Google OAuth ────────────────────────────────────────────────

export interface GoogleUserInfo {
  sub: string;
  email: string;
  name: string;
  picture?: string;
}

export async function handleGoogleOAuth(googleUser: GoogleUserInfo): Promise<{ id: string; name: string; email: string; isNew: boolean }> {
  const [accountRows] = await pool.execute(
    'SELECT a.*, u.name, u.email as user_email FROM accounts a JOIN users u ON a.user_id = u.id WHERE a.provider = ? AND a.provider_id = ?',
    ['google', googleUser.sub]
  ) as [any[], any];

  if (accountRows.length > 0) {
    const account = accountRows[0];
    return { id: account.user_id, name: account.name, email: account.user_email, isNew: false };
  }

  const existingUser = await findUserByEmail(googleUser.email);

  if (existingUser) {
    await pool.execute(
      'INSERT INTO accounts (id, user_id, provider, provider_id, provider_email) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), existingUser.id, 'google', googleUser.sub, googleUser.email]
    );
    return { id: existingUser.id, name: existingUser.name, email: existingUser.email, isNew: false };
  }

  const userId = uuidv4();
  const conn = await (await import('../config/db')).pool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.execute(
      'INSERT INTO users (id, name, email, is_email_verified) VALUES (?, ?, ?, ?)',
      [userId, googleUser.name, googleUser.email, 1]
    );
    await conn.execute(
      'INSERT INTO accounts (id, user_id, provider, provider_id, provider_email) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), userId, 'google', googleUser.sub, googleUser.email]
    );
    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  sendWelcomeEmail(googleUser.email, googleUser.name).catch((err) =>
    console.error('[Email] Failed to send welcome email:', err.message)
  );

  return { id: userId, name: googleUser.name, email: googleUser.email, isNew: true };
}

export async function getUserById(id: string): Promise<{ id: string; name: string; email: string } | null> {
  const user = await findUserById(id);
  if (!user) return null;
  return { id: user.id, name: user.name, email: user.email };
}