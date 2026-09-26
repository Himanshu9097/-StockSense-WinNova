import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { EmailService } from '../services/emailService';
import jwt from 'jsonwebtoken';
import { User } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_stock_sense_key';

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
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(200).json({
      accessToken,
      user: { id: user._id, email: user.email, name: user.name, role: user.role }
    });
  } catch (error: any) {
    res.status(401).json({ error: 'Invalid email or password' });
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie('refreshToken');
  res.status(200).json({ message: 'Logged out successfully' });
};

export const refresh = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };
export const verifyEmail = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };
export const resendVerification = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    
    const otp = await AuthService.forgotPassword(email, ip);
    if (otp) {
      await EmailService.sendOTP(email, otp);
    }
    
    // Always return success to prevent email enumeration
    res.status(200).json({ message: 'If an account with that email exists, an OTP has been sent.' });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const verifyOtp = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    await AuthService.resetPassword(req.body, ip);
    res.status(200).json({ message: 'Password has been reset successfully' });
  } catch (error: any) {
    console.error("Reset password error:", error);
    res.status(400).json({ error: error.message || 'Invalid request' });
  }
};

// Real implementation: decode JWT and return the user
export const getMe = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;

    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({ error: 'Token expired' });
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
};

export const getSessions = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };
export const revokeSession = async (req: Request, res: Response) => { res.status(200).json({ message: 'Not implemented' }); };
