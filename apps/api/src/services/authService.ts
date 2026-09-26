import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { User, Organization, Session, SecurityEvent, LoginAttempt, PasswordResetToken } from '../models';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_stock_sense_key';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'super_secret_refresh_key';
const JWT_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';

export class AuthService {
  static async signup(data: any, ip: string, userAgent: string) {
    const { name, email, password, organizationName, role } = data;
    
    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('Email already in use'); 
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create org
    const org = await Organization.create({ name: organizationName });

    // Create user
    const user = await User.create({
      email,
      name,
      passwordHash,
      organizationId: org._id,
      role: role || 'ORG_ADMIN'
    });

    // Log security event
    await SecurityEvent.create({ eventType: 'SIGNUP_SUCCESS', userId: user._id, ip, details: 'User registered and organization created' });

    return user;
  }

  static async login(data: any, ip: string, userAgent: string) {
    const { email, password } = data;
    const user = await User.findOne({ email });
    
    if (!user) {
      await LoginAttempt.create({ email, ip, success: false });
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      await LoginAttempt.create({ email, userId: user._id, ip, success: false });
      throw new Error('Invalid credentials');
    }

    await LoginAttempt.create({ email, userId: user._id, ip, success: true });
    
    // Create session
    const refreshToken = jwt.sign({ userId: user._id, type: 'refresh' }, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES_IN });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const session = await Session.create({
      userId: user._id,
      device: userAgent,
      ip,
      refreshToken,
      expiresAt
    });

    const accessToken = jwt.sign({ userId: user._id, sessionId: session._id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    await SecurityEvent.create({ eventType: 'LOGIN_SUCCESS', userId: user._id, ip, details: `Session ${session._id}` });

    return { user, accessToken, refreshToken };
  }

  static async forgotPassword(email: string, ip: string) {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't leak user existence
      return;
    }
    
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    const hashedOtp = await bcrypt.hash(otp, 10);

    await PasswordResetToken.findOneAndUpdate(
      { userId: user._id },
      { token: hashedOtp, expiresAt, attempts: 0 },
      { upsert: true, new: true }
    );

    await SecurityEvent.create({ eventType: 'PASSWORD_RESET_REQUESTED', userId: user._id, ip });

    return otp; 
  }
}
