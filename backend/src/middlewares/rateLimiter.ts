import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

// Skip or elevate rate limiting in development so local testing/development is never throttled
const isDev = !env.isProduction;

export const registerLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 20,
  skip: () => isDev,
  message: { success: false, message: 'Too many registration attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 50,
  skip: () => isDev,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 10,
  skip: () => isDev,
  message: { success: false, message: 'Too many password reset requests. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 20,
  skip: () => isDev,
  message: { success: false, message: 'Too many reset attempts. Please try again in 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 100,
  skip: () => isDev,
  message: { success: false, message: 'Too many refresh attempts.' },
  standardHeaders: true,
  legacyHeaders: false,
});
