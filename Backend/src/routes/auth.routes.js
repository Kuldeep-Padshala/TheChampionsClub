const { Router } = require('express');
const {
  register, login, logout, refresh,
  googleRedirect, googleCallback,
  forgotPassword, resetPasswordHandler,
  getMe,
  registerValidators, loginValidators,
  forgotPasswordValidators, resetPasswordValidators,
} = require('../controllers/auth.controller');
const { validate } = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth.middleware');
const {
  registerLimiter, loginLimiter,
  forgotPasswordLimiter, resetPasswordLimiter,
  refreshLimiter,
} = require('../middleware/rateLimiter');

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

module.exports = router;
