"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.hashToken = hashToken;
exports.storeRefreshToken = storeRefreshToken;
exports.revokeRefreshToken = revokeRefreshToken;
exports.revokeAllUserRefreshTokens = revokeAllUserRefreshTokens;
exports.validateStoredRefreshToken = validateStoredRefreshToken;
exports.setTokenCookies = setTokenCookies;
exports.clearTokenCookies = clearTokenCookies;
exports.issueTokens = issueTokens;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../config/env");
const db_1 = require("../config/db");
const uuid_1 = require("uuid");
const COOKIE_OPTIONS_BASE = {
    httpOnly: true,
    secure: env_1.env.isProduction,
    sameSite: 'strict',
    path: '/',
};
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign({ ...payload }, env_1.env.jwt.accessSecret, { expiresIn: env_1.env.jwt.accessExpiry });
}
function signRefreshToken(payload) {
    return jsonwebtoken_1.default.sign({ ...payload }, env_1.env.jwt.refreshSecret, { expiresIn: env_1.env.jwt.refreshExpiry });
}
function verifyAccessToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.jwt.accessSecret);
}
function verifyRefreshToken(token) {
    return jsonwebtoken_1.default.verify(token, env_1.env.jwt.refreshSecret);
}
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
async function storeRefreshToken(userId, refreshToken) {
    const tokenHash = hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db_1.pool.execute('INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)', [(0, uuid_1.v4)(), userId, tokenHash, expiresAt]);
}
async function revokeRefreshToken(refreshToken) {
    const tokenHash = hashToken(refreshToken);
    await db_1.pool.execute('DELETE FROM refresh_tokens WHERE token_hash = ?', [tokenHash]);
}
async function revokeAllUserRefreshTokens(userId) {
    await db_1.pool.execute('DELETE FROM refresh_tokens WHERE user_id = ?', [userId]);
}
async function validateStoredRefreshToken(refreshToken) {
    const tokenHash = hashToken(refreshToken);
    const [rows] = await db_1.pool.execute('SELECT id FROM refresh_tokens WHERE token_hash = ? AND expires_at > NOW()', [tokenHash]);
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
