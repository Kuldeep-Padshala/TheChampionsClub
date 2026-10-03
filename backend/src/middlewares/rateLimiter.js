"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshLimiter = exports.resetPasswordLimiter = exports.forgotPasswordLimiter = exports.loginLimiter = exports.registerLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const env_1 = require("../config/env");
// Skip or elevate rate limiting in development so local testing/development is never throttled
const isDev = !env_1.env.isProduction;
exports.registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 10000 : 20,
    skip: () => isDev,
    message: { success: false, message: 'Too many registration attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 10000 : 50,
    skip: () => isDev,
    message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.forgotPasswordLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 10000 : 10,
    skip: () => isDev,
    message: { success: false, message: 'Too many password reset requests. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.resetPasswordLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 10000 : 20,
    skip: () => isDev,
    message: { success: false, message: 'Too many reset attempts. Please try again in 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
});
exports.refreshLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 10000 : 100,
    skip: () => isDev,
    message: { success: false, message: 'Too many refresh attempts.' },
    standardHeaders: true,
    legacyHeaders: false,
});
