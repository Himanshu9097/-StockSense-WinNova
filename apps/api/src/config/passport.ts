import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import dotenv from 'dotenv';
import { User, Organization } from '../models';

dotenv.config();

passport.serializeUser((user: any, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

const getOrCreateOAuthUser = async (profile: any, email: string, name: string) => {
  let user = await User.findOne({ email });
  if (!user) {
    // If not exists, create an organization automatically
    const org = await Organization.create({ name: `${name}'s Workspace` });
    user = await User.create({
      email,
      name,
      passwordHash: 'oauth_placeholder_' + Math.random().toString(36), // Dummy password since it's OAuth
      organizationId: org._id,
      role: 'ORG_ADMIN'
    });
  }
  return user;
};

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0]?.value;
      if (!email) return done(new Error('No email found from Google'), undefined);
      
      const user = await getOrCreateOAuthUser(profile, email, profile.displayName || 'Google User');
      return done(null, user);
    } catch (err) {
      return done(err as Error, undefined);
    }
  }));
}

// Ensure you define GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in .env if you want this to run
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
    scope: ['user:email']
  }, async (accessToken: string, refreshToken: string, profile: any, done: any) => {
    try {
      const email = profile.emails && profile.emails[0]?.value;
      if (!email) return done(new Error('No email found from GitHub'), undefined);

      const user = await getOrCreateOAuthUser(profile, email, profile.displayName || profile.username || 'GitHub User');
      return done(null, user);
    } catch (err) {
      return done(err as Error, undefined);
    }
  }));
}

export default passport;
