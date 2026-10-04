import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Response } from 'express';
import { env } from '../config/env';
import { pool } from '../config/db';
import { v4 as uuidv4 } from 'uuid';
import type { JwtPayload } from '../types';

const COOKIE_OPTIONS_BASE = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: 'strict' as const,
  path: '/',
};

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign({ ...payload }, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpiry as any });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign({ ...payload }, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpiry as any });
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.accessSecret) as JwtPayload;
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwt.refreshSecret) as JwtPayload;
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await pool.execute(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    [uuidv4(), userId, tokenHash, expiresAt]
  );
}

export async function revokeRefreshToken(refreshToken: string): Promise<void> {
  const tokenHash = hashToken(refreshToken);
  await pool.execute('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
}

export async function validateStoredRefreshToken(refreshToken: string): Promise<boolean> {
  const tokenHash = hashToken(refreshToken);
  const [rows] = await pool.execute(
    'SELECT id FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW()',
    [tokenHash]
  ) as [any[], any];
  return rows.length > 0;
}

export function setTokenCookies(res: Response, accessToken: string, refreshToken: string): void {
  res.cookie('__access_token', accessToken, {
    ...COOKIE_OPTIONS_BASE,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie('__refresh_token', refreshToken, {
    ...COOKIE_OPTIONS_BASE,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearTokenCookies(res: Response): void {
  res.clearCookie('__access_token', COOKIE_OPTIONS_BASE);
  res.clearCookie('__refresh_token', COOKIE_OPTIONS_BASE);
}

export async function issueTokens(res: Response, userId: string, email: string): Promise<void> {
  const payload: JwtPayload = { userId, email };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await storeRefreshToken(userId, refreshToken);
  setTokenCookies(res, accessToken, refreshToken);
}
