export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  password_hash: string | null;
  status?: string;
  must_change_password?: number;
  failed_login_count?: number;
  locked_until?: Date | null;
  last_login_at?: Date | null;
  is_email_verified: number;
  created_at: Date;
  updated_at: Date;
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
  roles?: string[];
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
