import { Router } from 'express';
import {
  register, login, logout, refresh,
  googleRedirect, googleCallback,
  forgotPassword, resetPasswordHandler,
  getMe,
  registerValidators, loginValidators,
  forgotPasswordValidators, resetPasswordValidators,
} from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import { requireAuth } from '../middleware/auth.middleware';
import {
  registerLimiter, loginLimiter,
  forgotPasswordLimiter, resetPasswordLimiter,
  refreshLimiter,
} from '../middleware/rateLimiter';

const router = Router();

router.post('/register', registerLimiter, registerValidators, validate, register);
router.post('/login', loginLimiter, loginValidators, validate, login);
router.post('/logout', logout);
router.post('/refresh', refreshLimiter, refresh);
router.get('/google', googleRedirect);
router.get('/google/callback', googleCallback);
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidators, validate, forgotPassword);
router.post('/reset-password', resetPasswordLimiter, resetPasswordValidators, validate, resetPasswordHandler);
router.get('/me', requireAuth, getMe);

export default router;
