import { Router } from 'express';
import { signup, login, logout, refresh, verifyEmail, resendVerification, forgotPassword, verifyOtp, resetPassword, getMe, getSessions, revokeSession } from '../controllers/authController';

const router = Router();

// Routes
router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.post('/refresh', refresh);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOtp);
router.post('/reset-password', resetPassword);
router.get('/me', getMe);
router.get('/sessions', getSessions);
router.delete('/sessions/:id', revokeSession);

import passport from 'passport';
import jwt from 'jsonwebtoken';
import { Session } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_stock_sense_key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'super_secret_refresh_key';

// Helper to issue tokens for OAuth users
const handleOAuthSuccess = async (req: any, res: any) => {
  const user = req.user;
  const refreshToken = jwt.sign({ userId: user._id, type: 'refresh' }, REFRESH_SECRET, { expiresIn: '7d' });
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7);

  const session = await Session.create({
    userId: user._id,
    device: req.headers['user-agent'] || 'unknown',
    ip: req.ip || req.socket.remoteAddress || 'unknown',
    refreshToken,
    expiresAt
  });

  const accessToken = jwt.sign({ userId: user._id, sessionId: session._id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });

  // Set refresh token in cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  // Redirect to frontend with access token
  res.redirect(`http://localhost:5173/login?token=${accessToken}`);
};

// OAuth routes
router.get('/google', (req, res, next) => {
  if (!process.env.GOOGLE_CLIENT_ID) return res.status(501).send('Google OAuth is not configured in .env');
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});
router.get('/google/callback', passport.authenticate('google', { failureRedirect: 'http://localhost:5173/login?error=GoogleAuthFailed' }), handleOAuthSuccess);

router.get('/github', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID) return res.status(501).send('GitHub OAuth is not configured in .env');
  passport.authenticate('github', { scope: ['user:email'] })(req, res, next);
});
router.get('/github/callback', (req, res, next) => {
  if (!process.env.GITHUB_CLIENT_ID) return res.status(501).send('GitHub OAuth is not configured');
  passport.authenticate('github', { failureRedirect: 'http://localhost:5173/login?error=GithubAuthFailed' })(req, res, next);
}, handleOAuthSuccess);

export default router;
