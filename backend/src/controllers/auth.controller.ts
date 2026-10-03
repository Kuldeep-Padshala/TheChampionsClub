import { Request, Response } from 'express';
import { loginUser } from '../services/auth.service';
import { generateAccessToken } from '../services/token.service';

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Validate credentials using the service
    const user = await loginUser({ email, password });
    
    // Generate JWT token
    const token = generateAccessToken(user.id, user.email, user.roles);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user
    });
  } catch (error: any) {
    console.error('[Login Error]', error);
    res.status(error.statusCode || 500).json({ 
      success: false, 
      message: error.message || 'Server Error' 
    });
  }
};
