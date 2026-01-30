import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { User } from '../models/User.js';
import mongoose from 'mongoose';
import { connectDB } from '../db/index.js';
import dotenv from 'dotenv';
import { handleOAuthLogin } from '../config/passport.js';

dotenv.config();

describe('OAuth Authentication Logic', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create a new user on successful handleOAuthLogin', async () => {
    const timestamp = Date.now();
    const email = `oauth-user-${timestamp}@example.com`;
    const oauthId = `id-${timestamp}`;
    const mockProfile = {
      id: oauthId,
      emails: [{ value: email }],
      displayName: `OAuth User ${timestamp}`,
    };

    const done = vi.fn();
    await handleOAuthLogin('googleId', mockProfile as Parameters<typeof handleOAuthLogin>[1], done);

    expect(done).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        email: email,
        googleId: oauthId,
      })
    );

    const user = await User.findOne({ email });
    expect(user).toBeDefined();
  });

  it('should link accounts if the email already exists', async () => {
    const timestamp = Date.now();
    const email = `link-${timestamp}@example.com`;
    const username = `Existing User ${timestamp}`;
    await User.create({
      username: username,
      email: email,
      passwordHash: 'hashed_password',
    });

    const oauthId = `gh-${timestamp}`;
    const mockProfile = {
      id: oauthId,
      emails: [{ value: email }],
      username: `githubuser-${timestamp}`,
    };

    const done = vi.fn();
    await handleOAuthLogin('githubId', mockProfile as Parameters<typeof handleOAuthLogin>[1], done);

    const updatedUser = await User.findOne({ email });
    expect(updatedUser?.githubId).toBe(oauthId);
    expect(updatedUser?.username).toBe(username);
  });

  it('should fail if no email is provided', async () => {
    const mockProfile = {
      id: 'no-email-id',
      emails: [],
    };

    const done = vi.fn();
    await handleOAuthLogin('gitlabId', mockProfile as Parameters<typeof handleOAuthLogin>[1], done);

    expect(done).toHaveBeenCalledWith(expect.any(Error), undefined);
    expect(done.mock.calls[0][0].message).toContain('No email found');
  });
});
