import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  industry: { type: String },
  country: { type: String }
}, { timestamps: true });

export const Organization = mongoose.model('Organization', organizationSchema);

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  organizationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  role: { type: String, default: 'OPERATOR', index: true }
}, { timestamps: true });

export const User = mongoose.model('User', userSchema);

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  device: { type: String },
  browser: { type: String },
  ip: { type: String },
  refreshToken: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } },
  revokedAt: { type: Date },
  lastSeenAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const Session = mongoose.model('Session', sessionSchema);

const loginAttemptSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  email: { type: String, required: true, index: true },
  ip: { type: String },
  success: { type: Boolean, required: true }
}, { timestamps: true });

export const LoginAttempt = mongoose.model('LoginAttempt', loginAttemptSchema);

const securityEventSchema = new mongoose.Schema({
  eventType: { type: String, required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true },
  details: { type: String },
  ip: { type: String }
}, { timestamps: true });

export const SecurityEvent = mongoose.model('SecurityEvent', securityEventSchema);

const passwordResetTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  token: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  expiresAt: { type: Date, required: true, index: { expireAfterSeconds: 0 } }
}, { timestamps: true });

export const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema);
