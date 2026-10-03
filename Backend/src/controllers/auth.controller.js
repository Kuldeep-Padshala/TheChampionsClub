const { body } = require('express-validator');
const { google } = require('googleapis');
const {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  handleGoogleOAuth,
  getUserById,
} = require('../services/auth.service');
const {
  issueTokens,
  clearTokenCookies,
  verifyRefreshToken,
  revokeRefreshToken,
  validateStoredRefreshToken,
  storeRefreshToken,
  signAccessToken,
  signRefreshToken,
  setTokenCookies,
} = require('../services/token.service');
const { env } = require('../config/env');

const oauthClient = new google.auth.OAuth2(
  env.google.clientId,
  env.google.clientSecret,
  env.google.redirectUri
);

// ─── Validators ───────────────────────────────────────────────

const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('phone').optional().trim(),
  body('role').optional().trim(),
  body('date_of_birth').optional().trim(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('Password must contain at least one special character'),
];

const loginValidators = [
  body('email').trim().notEmpty().withMessage('Email or phone is required'),
  body('password').notEmpty().withMessage('Password is required'),
];

const forgotPasswordValidators = [
  body('email').trim().isEmail().normalizeEmail(),
];

const resetPasswordValidators = [
  body('email').trim().isEmail().normalizeEmail(),
  body('otp').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be a 6-digit number'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('Password must contain at least one special character'),
];

// ─── Handlers ─────────────────────────────────────────────────

async function register(req, res) {
  try {
    const user = await registerUser(req.body);
    const { accessToken, refreshToken } = await issueTokens(res, user.id, user.email);
    res.status(201).json({ success: true, user, token: accessToken, tokens: { accessToken, refreshToken } });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function login(req, res) {
  try {
    const user = await loginUser(req.body);
    const { accessToken, refreshToken } = await issueTokens(res, user.id, user.email);
    res.json({ success: true, user, token: accessToken, tokens: { accessToken, refreshToken } });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function logout(req, res) {
  try {
    const refreshToken = req.cookies['__refresh_token'];
    if (refreshToken) await revokeRefreshToken(refreshToken);
    clearTokenCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
}

async function refresh(req, res) {
  try {
    const refreshToken = req.cookies['__refresh_token'];
    if (!refreshToken) {
      res.status(401).json({ success: false, message: 'No refresh token' });
      return;
    }

    const payload = verifyRefreshToken(refreshToken);
    const isValid = await validateStoredRefreshToken(refreshToken);
    if (!isValid) {
      res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
      return;
    }

    await revokeRefreshToken(refreshToken);
    const newAccessToken = signAccessToken({ userId: payload.userId, email: payload.email });
    const newRefreshToken = signRefreshToken({ userId: payload.userId, email: payload.email });
    await storeRefreshToken(payload.userId, newRefreshToken);
    setTokenCookies(res, newAccessToken, newRefreshToken);

    res.json({ success: true });
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
  }
}

function getOAuthClient() {
  return new google.auth.OAuth2(
    env.google.clientId,
    env.google.clientSecret,
    env.google.redirectUri
  );
}

async function googleRedirect(req, res) {
  if (!env.google.clientId || !env.google.clientSecret) {
    res.redirect(`${env.clientUrl}/login?error=google_not_configured`);
    return;
  }
  const client = getOAuthClient();
  const url = client.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'consent',
  });
  res.redirect(url);
}

async function googleCallback(req, res) {
  try {
    const { code } = req.query;
    if (!code) {
      res.redirect(`${env.clientUrl}/login?error=google_failed`);
      return;
    }

    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: env.google.clientId,
    });
    const googlePayload = ticket.getPayload();
    if (!googlePayload || !googlePayload.sub || !googlePayload.email) {
      res.redirect(`${env.clientUrl}/login?error=google_failed`);
      return;
    }

    const user = await handleGoogleOAuth({
      sub: googlePayload.sub,
      email: googlePayload.email,
      name: googlePayload.name || googlePayload.email.split('@')[0],
      picture: googlePayload.picture,
    });

    const { accessToken } = await issueTokens(res, user.id, user.email);
    const isStaff = user.roles && user.roles.some((r) => ['FRONT_DESK', 'MANAGER', 'OWNER'].includes(r));
    const targetPath = isStaff ? '/frontdesk' : '/member';
    res.redirect(`${env.clientUrl}${targetPath}?token=${accessToken}`);
  } catch (err) {
    console.error('[Google OAuth] Error:', err.message);
    res.redirect(`${env.clientUrl}/login?error=google_failed`);
  }
}

async function forgotPassword(req, res) {
  try {
    await requestPasswordReset(req.body.email);
    res.json({ success: true, message: 'A reset code has been sent to your email.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message || 'An error occurred. Please try again.' });
  }
}

async function resetPasswordHandler(req, res) {
  try {
    const { email, otp, newPassword } = req.body;
    await resetPassword(email, otp, newPassword);
    clearTokenCookies(res);
    res.json({ success: true, message: 'Password reset successfully. Please sign in.' });
  } catch (err) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

async function getMe(req, res) {
  try {
    const user = await getUserById(req.user.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
}

module.exports = {
  registerValidators,
  loginValidators,
  forgotPasswordValidators,
  resetPasswordValidators,
  register,
  login,
  logout,
  refresh,
  googleRedirect,
  googleCallback,
  forgotPassword,
  resetPasswordHandler,
  getMe,
};
