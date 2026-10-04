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
    scope: ['openid', 'profile', 'email'],
    prompt: 'consent',
  });
  res.redirect(url);
}

async function googleCallback(req, res) {
  try {
    const { code, error, error_description } = req.query;
    if (error) {
      console.warn('[Google OAuth] Consent error from Google:', error, error_description);
      res.redirect(`${env.clientUrl}/login?error=google_failed&details=${encodeURIComponent(error_description || error)}`);
      return;
    }

    if (!code) {
      res.redirect(`${env.clientUrl}/login?error=google_failed`);
      return;
    }

    const client = getOAuthClient();
    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    let googleEmail = null;
    let googleName = null;
    let googleSub = null;
    let googlePicture = null;

    // 1. Try verifyIdToken if id_token exists
    if (tokens.id_token) {
      try {
        const ticket = await client.verifyIdToken({
          idToken: tokens.id_token,
          audience: env.google.clientId,
        });
        const googlePayload = ticket.getPayload();
        if (googlePayload && googlePayload.email) {
          googleEmail = googlePayload.email;
          googleName = googlePayload.name || googlePayload.email.split('@')[0];
          googleSub = googlePayload.sub;
          googlePicture = googlePayload.picture;
        }
      } catch (ticketErr) {
        console.warn('[Google OAuth] verifyIdToken note:', ticketErr.message);
      }
    }

    // 2. Fallback to Google OAuth2 UserInfo API if id_token verification didn't get email
    if (!googleEmail) {
      try {
        const oauth2 = google.oauth2({ version: 'v2', auth: client });
        const { data: userInfo } = await oauth2.userinfo.get();
        if (userInfo && userInfo.email) {
          googleEmail = userInfo.email;
          googleName = userInfo.name || userInfo.email.split('@')[0];
          googleSub = userInfo.id || userInfo.sub;
          googlePicture = userInfo.picture;
        }
      } catch (apiErr) {
        console.error('[Google OAuth] userinfo API error:', apiErr.message);
      }
    }

    if (!googleEmail) {
      console.error('[Google OAuth] Could not extract email from Google profile');
      res.redirect(`${env.clientUrl}/login?error=google_failed`);
      return;
    }

    const user = await handleGoogleOAuth({
      sub: googleSub,
      email: googleEmail,
      name: googleName,
      picture: googlePicture,
    });

    const { accessToken } = await issueTokens(res, user.id, user.email);

    // Smart role-based destination redirect
    const userRoles = user.roles || [];
    let targetPath = '/member';
    if (userRoles.includes('OWNER')) targetPath = '/owner';
    else if (userRoles.includes('SYSTEM_ADMIN') || userRoles.includes('ADMIN')) targetPath = '/admin';
    else if (userRoles.includes('MANAGER')) targetPath = '/manager';
    else if (userRoles.includes('ACCOUNTANT')) targetPath = '/finance';
    else if (userRoles.includes('SHOP_STAFF') || userRoles.includes('GEAR_BOX_STAFF')) targetPath = '/shop-station';
    else if (userRoles.includes('BAR_STAFF')) targetPath = '/bar';
    else if (userRoles.includes('FRONT_DESK')) targetPath = '/frontdesk';

    res.redirect(`${env.clientUrl}${targetPath}?token=${accessToken}`);
  } catch (err) {
    console.error('[Google OAuth] Error:', err.message);
    res.redirect(`${env.clientUrl}/login?error=google_failed&details=${encodeURIComponent(err.message)}`);
  }
}

async function googleVerifyToken(req, res) {
  try {
    const { credential, idToken, accessToken: clientAccessToken } = req.body;
    let googleEmail = null;
    let googleName = null;
    let googleSub = null;
    let googlePicture = null;

    const tokenToVerify = credential || idToken;
    if (tokenToVerify) {
      const client = getOAuthClient();
      try {
        const ticket = await client.verifyIdToken({
          idToken: tokenToVerify,
          audience: env.google.clientId,
        });
        const payload = ticket.getPayload();
        if (payload && payload.email) {
          googleEmail = payload.email;
          googleName = payload.name || payload.email.split('@')[0];
          googleSub = payload.sub;
          googlePicture = payload.picture;
        }
      } catch (e) {
        console.warn('[Google Verify] verifyIdToken note:', e.message);
      }
    }

    if (!googleEmail && clientAccessToken) {
      const client = getOAuthClient();
      client.setCredentials({ access_token: clientAccessToken });
      const oauth2 = google.oauth2({ version: 'v2', auth: client });
      const { data: userInfo } = await oauth2.userinfo.get();
      if (userInfo && userInfo.email) {
        googleEmail = userInfo.email;
        googleName = userInfo.name || userInfo.email.split('@')[0];
        googleSub = userInfo.id || userInfo.sub;
        googlePicture = userInfo.picture;
      }
    }

    if (!googleEmail) {
      return res.status(400).json({ success: false, message: 'Could not resolve Google account email' });
    }

    const user = await handleGoogleOAuth({
      sub: googleSub,
      email: googleEmail,
      name: googleName,
      picture: googlePicture,
    });

    const { accessToken, refreshToken } = await issueTokens(res, user.id, user.email);
    res.json({
      success: true,
      user,
      token: accessToken,
      tokens: { accessToken, refreshToken },
    });
  } catch (err) {
    console.error('[Google Verify Token Error]', err);
    res.status(500).json({ success: false, message: 'Google authentication failed: ' + err.message });
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
  googleVerifyToken,
  forgotPassword,
  resetPasswordHandler,
  getMe,
};
