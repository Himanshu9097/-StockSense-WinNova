import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { EmailService } from '../services/emailService';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { User } from '../models';

if (!process.env.JWT_SECRET) {
  throw new Error('FATAL ERROR: JWT_SECRET is not defined.');
}
const JWT_SECRET = process.env.JWT_SECRET;

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

export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) return res.status(401).json({ error: 'No refresh token' });

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_SECRET || 'super_secret_refresh_key') as any;
    
    // Check if session exists and is valid
    const session = await mongoose.model('Session').findOne({ 
      _id: decoded.sessionId || decoded.userId, // Fallback if no sessionId was encoded
      refreshToken 
    });
    
    if (!session || session.expiresAt < new Date() || session.revokedAt) {
      return res.status(401).json({ error: 'Invalid or expired session' });
    }

    const user = await User.findById(session.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const newAccessToken = jwt.sign(
      { userId: user._id, sessionId: session._id, role: user.role }, 
      JWT_SECRET, 
      { expiresIn: '15m' }
    );

    res.status(200).json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

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

export const verifyOtp = async (req: Request, res: Response) => { 
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid OTP' });

    const resetToken = await mongoose.model('PasswordResetToken').findOne({ userId: user._id });
    if (!resetToken || resetToken.expiresAt < new Date()) {
      return res.status(400).json({ error: 'OTP expired or invalid' });
    }

    if (resetToken.attempts >= 3) {
      return res.status(400).json({ error: 'Too many failed attempts.' });
    }

    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(otp, resetToken.token);
    
    if (!isValid) {
      resetToken.attempts += 1;
      await resetToken.save();
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    res.status(200).json({ message: 'OTP verified successfully' });
  } catch (error: any) {
    res.status(500).json({ error: 'Failed to verify OTP' });
  }
};

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

export const getSessions = async (req: Request, res: Response) => { 
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const Session = mongoose.model('Session');
    const sessions = await Session.find({ userId: decoded.userId, revokedAt: null }).sort({ lastSeenAt: -1 });
    
    res.status(200).json(sessions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve sessions' });
  }
};

export const revokeSession = async (req: Request, res: Response) => { 
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    const { id } = req.params;
    const Session = mongoose.model('Session');
    
    const session = await Session.findOneAndUpdate(
      { _id: id, userId: decoded.userId },
      { revokedAt: new Date() }
    );
    
    if (!session) return res.status(404).json({ error: 'Session not found' });
    
    res.status(200).json({ message: 'Session revoked' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to revoke session' });
  }
};
