import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../services/token.service';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.cookies['__access_token'];
  if (!token) {
    res.status(401).json({ success: false, message: 'Unauthorized' });
    return;
  }
  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.userId, name: '', email: payload.email };
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
}
