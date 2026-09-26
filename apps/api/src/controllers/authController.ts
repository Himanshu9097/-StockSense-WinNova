import { Request, Response } from 'express';
import { AuthService } from '../services/authService';

export const signup = async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const user = await AuthService.signup(req.body, ip, userAgent);
    res.status(201).json({ message: 'User created successfully', user: { id: user._id, email: user.email, name: user.name } });
  } catch (error: any) {
    console.error("Signup error:", error);
    if (error.message === 'Email already in use') {
      res.status(400).json({ error: 'This email is already registered.' });
    } else {
      res.status(400).json({ error: error.message || 'Invalid signup details' });
    }
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const { user, accessToken, refreshToken } = await AuthService.login(req.body, ip, userAgent);
    
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      accessToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid email or password' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
};

// Placeholder for remaining routes
export const refresh = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };
export const verifyEmail = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };
export const resendVerification = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };
export const forgotPassword = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };
export const verifyOtp = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };
export const resetPassword = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };
export const getMe = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };
export const getSessions = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };
export const revokeSession = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };
