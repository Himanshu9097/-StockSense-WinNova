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

// OAuth stubs
router.get('/google', (req, res) => res.status(200).send('Google OAuth not fully implemented yet'));
router.get('/github', (req, res) => res.status(200).send('GitHub OAuth not fully implemented yet'));

export default router;
