import { Request, Response } from 'express';
import { body } from 'express-validator';
import { google } from 'googleapis';
import {
  registerUser,
  loginUser,
  requestPasswordReset,
  resetPassword,
  handleGoogleOAuth,
  getUserById,
} from '../services/auth.service';
import {
  issueTokens,
  clearTokenCookies,
  verifyRefreshToken,
  revokeRefreshToken,
  validateStoredRefreshToken,
  storeRefreshToken,
  signAccessToken,
  signRefreshToken,
  setTokenCookies,
} from '../services/token.service';
import { env } from '../config/env';

const oauthClient = new google.auth.OAuth2(
  env.google.clientId,
  env.google.clientSecret,
  env.google.redirectUri
);

// ─── Validators ───────────────────────────────────────────────

export const registerValidators = [
  body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }),
  body('email').trim().isEmail().withMessage('Invalid email address').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('Password must contain at least one special character'),
];

export const loginValidators = [
  body('email').trim().isEmail().normalizeEmail(),
  body('password').notEmpty(),
];

export const forgotPasswordValidators = [
  body('email').trim().isEmail().normalizeEmail(),
];

export const resetPasswordValidators = [
  body('email').trim().isEmail().normalizeEmail(),
  body('otp').trim().isLength({ min: 6, max: 6 }).isNumeric().withMessage('OTP must be a 6-digit number'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/).withMessage('Password must contain at least one special character'),
];

// ─── Handlers ─────────────────────────────────────────────────

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const user = await registerUser(req.body);
    await issueTokens(res, user.id, user.email);
    res.status(201).json({ success: true, user });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const user = await loginUser(req.body);
    await issueTokens(res, user.id, user.email);
    res.json({ success: true, user });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

export async function logout(req: Request, res: Response): Promise<void> {
  try {
    const refreshToken = req.cookies['__refresh_token'];
    if (refreshToken) await revokeRefreshToken(refreshToken);
    clearTokenCookies(res);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err: any) {
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
}

export async function refresh(req: Request, res: Response): Promise<void> {
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

export async function googleRedirect(req: Request, res: Response): Promise<void> {
  if (!env.google.clientId || !env.google.clientSecret) {
    res.redirect(`${env.clientUrl}/login?error=google_not_configured`);
    return;
  }
  const url = oauthClient.generateAuthUrl({
    access_type: 'offline',
    scope: ['profile', 'email'],
    prompt: 'consent',
  });
  res.redirect(url);
}

export async function googleCallback(req: Request, res: Response): Promise<void> {
  try {
    const { code } = req.query as { code: string };
    if (!code) {
      res.redirect(`${env.clientUrl}/login?error=google_failed`);
      return;
    }

    const { tokens } = await oauthClient.getToken(code);
    oauthClient.setCredentials(tokens);

    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token!,
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

    await issueTokens(res, user.id, user.email);
    res.redirect(`${env.clientUrl}/`);
  } catch (err: any) {
    console.error('[Google OAuth] Error:', err.message);
    res.redirect(`${env.clientUrl}/login?error=google_failed`);
  }
}

export async function forgotPassword(req: Request, res: Response): Promise<void> {
  try {
    await requestPasswordReset(req.body.email);
    res.json({ success: true, message: 'A reset code has been sent to your email.' });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message || 'An error occurred. Please try again.' });
  }
}

export async function resetPasswordHandler(req: Request, res: Response): Promise<void> {
  try {
    const { email, otp, newPassword } = req.body;
    await resetPassword(email, otp, newPassword);
    clearTokenCookies(res);
    res.json({ success: true, message: 'Password reset successfully. Please sign in.' });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
}

export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const user = await getUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }
    res.json({ success: true, user });
  } catch {
    res.status(500).json({ success: false, message: 'Failed to fetch user' });
  }
}