import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { User } from '../models/User.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing Google OAuth credentials. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.'
    );
  } else {
    console.warn('Missing Google OAuth credentials. OAuth will not work.');
  }
}

if (!CALLBACK_URL) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Missing GOOGLE_CALLBACK_URL. Please set it to your backend URL + /api/auth/google/callback (e.g., https://your-app.onrender.com/api/auth/google/callback)'
    );
  } else {
    console.warn('Missing GOOGLE_CALLBACK_URL. Defaulting to localhost.');
  }
}

const finalCallbackUrl = CALLBACK_URL || 'http://localhost:3000/api/auth/google/callback';
console.log(`Google OAuth Callback URL set to: ${finalCallbackUrl}`);

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID || 'placeholder_id',
      clientSecret: GOOGLE_CLIENT_SECRET || 'placeholder_secret',
      callbackURL: finalCallbackUrl,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          return done(null, user);
        }

        // Check if user exists with same email (link account)
        const email = profile.emails?.[0].value;
        if (email) {
          user = await User.findOne({ email });
          if (user) {
            user.googleId = profile.id;
            await user.save();
            return done(null, user);
          }
        }

        // Create new user
        user = await User.create({
          googleId: profile.id,
          username: profile.displayName,
          email: email,
        });

        return done(null, user);
      } catch (error) {
        return done(error as Error, undefined);
      }
    }
  )
);

export default passport;
