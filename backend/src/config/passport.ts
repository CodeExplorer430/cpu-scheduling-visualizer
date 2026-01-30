import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy } from 'passport-github2';
import { Strategy as GitLabStrategy } from 'passport-gitlab2';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { Strategy as LinkedInStrategy } from 'passport-linkedin-oauth2';
import { User } from '../models/User.js';

// --- Configuration Helper ---
const getAuthConfig = (provider: string) => {
  const upper = provider.toUpperCase();
  const clientID = process.env[`${upper}_CLIENT_ID`];
  const clientSecret = process.env[`${upper}_CLIENT_SECRET`];
  const callbackURL =
    process.env[`${upper}_CALLBACK_URL`] || `http://localhost:3000/api/auth/${provider}/callback`;

  if (!clientID || !clientSecret) {
    if (provider === 'google' && process.env.NODE_ENV === 'production') {
      throw new Error(
        `Missing ${upper} credentials. Please set ${upper}_CLIENT_ID and ${upper}_CLIENT_SECRET.`
      );
    }
    console.warn(`Missing ${upper} credentials. ${provider} OAuth will not work.`);
    return null;
  }
  return { clientID, clientSecret, callbackURL };
};

interface OAuthProfile {
  id: string;
  displayName?: string;
  username?: string;
  emails?: Array<{ value: string }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PassportDone = (error: Error | null | unknown, user?: any) => void;

// --- Generic Handler ---
const handleOAuthLogin = async (
  providerKey: string, // e.g., 'googleId', 'githubId'
  profile: OAuthProfile,
  done: PassportDone
) => {
  try {
    // 1. Check if user exists with this provider ID
    let user = await User.findOne({ [providerKey]: profile.id });
    if (user) {
      return done(null, user);
    }

    // 2. Check if user exists with same email (link account)
    const email = profile.emails?.[0]?.value;
    if (email) {
      user = await User.findOne({ email });
      if (user) {
        // Link the new provider to existing user
        user.set(providerKey, profile.id);
        await user.save();
        return done(null, user);
      }
    }

    // 3. Create new user
    if (!email) {
      return done(new Error(`No email found in ${String(providerKey)} profile`), undefined);
    }

    user = await User.create({
      [providerKey]: profile.id,
      username: profile.displayName || profile.username || email.split('@')[0],
      email: email,
    });

    return done(null, user);
  } catch (error) {
    return done(error, undefined);
  }
};

// --- Strategies ---

// 1. Google
const googleConfig = getAuthConfig('google');
if (googleConfig) {
  console.log(`Google Callback: ${googleConfig.callbackURL}`);
  passport.use(
    new GoogleStrategy(
      {
        clientID: googleConfig.clientID,
        clientSecret: googleConfig.clientSecret,
        callbackURL: googleConfig.callbackURL,
      },
      (_accessToken, _refreshToken, profile: GoogleProfile, done) =>
        handleOAuthLogin('googleId', profile as unknown as OAuthProfile, done)
    )
  );
}

// 2. GitHub
const githubConfig = getAuthConfig('github');
if (githubConfig) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  passport.use(
    new GitHubStrategy(
      {
        clientID: githubConfig.clientID,
        clientSecret: githubConfig.clientSecret,
        callbackURL: githubConfig.callbackURL,
        scope: ['user:email'],
      },
      ((_accessToken: string, _refreshToken: string, profile: any, done: any) =>
        handleOAuthLogin('githubId', profile as OAuthProfile, done)) as any
    )
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

// 3. GitLab
const gitlabConfig = getAuthConfig('gitlab');
if (gitlabConfig) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  passport.use(
    new GitLabStrategy(
      {
        clientID: gitlabConfig.clientID,
        clientSecret: gitlabConfig.clientSecret,
        callbackURL: gitlabConfig.callbackURL,
        scope: ['read_user'],
      },
      ((_accessToken: string, _refreshToken: string, profile: any, done: any) =>
        handleOAuthLogin('gitlabId', profile as OAuthProfile, done)) as any
    )
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

// 4. Discord
const discordConfig = getAuthConfig('discord');
if (discordConfig) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  passport.use(
    new DiscordStrategy(
      {
        clientID: discordConfig.clientID,
        clientSecret: discordConfig.clientSecret,
        callbackURL: discordConfig.callbackURL,
        scope: ['identify', 'email'],
      } as any,
      ((_accessToken: string, _refreshToken: string, profile: any, done: any) =>
        handleOAuthLogin('discordId', profile as OAuthProfile, done)) as any
    )
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

// 5. LinkedIn
const linkedinConfig = getAuthConfig('linkedin');
if (linkedinConfig) {
  /* eslint-disable @typescript-eslint/no-explicit-any */
  passport.use(
    new LinkedInStrategy(
      {
        clientID: linkedinConfig.clientID,
        clientSecret: linkedinConfig.clientSecret,
        callbackURL: linkedinConfig.callbackURL,
        scope: ['openid', 'profile', 'email'],
        userProfileURL: 'https://api.linkedin.com/v2/userinfo',
      },
      ((_accessToken: string, _refreshToken: string, profile: any, done: any) =>
        handleOAuthLogin('linkedinId', profile as OAuthProfile, done)) as any
    )
  );
  /* eslint-enable @typescript-eslint/no-explicit-any */
}

export default passport;
