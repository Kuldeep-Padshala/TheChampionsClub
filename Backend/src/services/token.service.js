const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { env } = require('../config/env');
const { pool } = require('../config/db');

const COOKIE_OPTIONS_BASE = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'lax',
  path: '/',
};

function signAccessToken(payload) {
  return jwt.sign({ ...payload }, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiry });
}

function signRefreshToken(payload) {
  return jwt.sign({ ...payload }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiry });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function storeRefreshToken(userId, refreshToken) {
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.execute(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    [uuidv4(), userId, tokenHash, expiresAt]
  );
}

async function revokeRefreshToken(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  await pool.execute('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
}

async function revokeAllUserRefreshTokens(userId) {
  await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
}

async function validateStoredRefreshToken(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  const [rows] = await pool.execute(
    'SELECT id FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW()',
    [tokenHash]
  );
  return rows.length > 0;
}

function setTokenCookies(res, accessToken, refreshToken) {
  res.cookie('__access_token', accessToken, {
    ...COOKIE_OPTIONS_BASE,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('__refresh_token', refreshToken, {
    ...COOKIE_OPTIONS_BASE,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

function clearTokenCookies(res) {
  res.clearCookie('__access_token', COOKIE_OPTIONS_BASE);
  res.clearCookie('__refresh_token', COOKIE_OPTIONS_BASE);
}

async function issueTokens(res, userId, email) {
  const payload = { userId, email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await storeRefreshToken(userId, refreshToken);
  setTokenCookies(res, accessToken, refreshToken);
  return { accessToken, refreshToken };
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  hashToken,
  storeRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  validateStoredRefreshToken,
  setTokenCookies,
  clearTokenCookies,
  issueTokens,
};
