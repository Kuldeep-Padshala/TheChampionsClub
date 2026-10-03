export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string | null;
  is_email_verified: number;
  created_at: Date;
  updated_at: Date;
}

export interface Account {
  id: string;
  user_id: string;
  provider: 'google';
  provider_id: string;
  provider_email: string;
  created_at: Date;
}

export interface PasswordResetOtp {
  id: string;
  user_id: string;
  otp_hash: string;
  expires_at: Date;
  attempts: number;
  used: number;
  created_at: Date;
}

export interface RefreshToken {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  created_at: Date;
}

export interface JwtPayload {
  userId: string;
  email: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
