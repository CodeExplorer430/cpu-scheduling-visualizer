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

  beforeEach(async () => {
    await User.deleteMany({});
  });

  it('should create a new user on successful handleOAuthLogin', async () => {
    const mockProfile = {
      id: '12345',
      emails: [{ value: 'oauth-user@example.com' }],
      displayName: 'OAuth User',
    };

    const done = vi.fn();
    await handleOAuthLogin('googleId', mockProfile as Parameters<typeof handleOAuthLogin>[1], done);

    expect(done).toHaveBeenCalledWith(
      null,
      expect.objectContaining({
        email: 'oauth-user@example.com',
        googleId: '12345',
      })
    );

    const user = await User.findOne({ email: 'oauth-user@example.com' });
    expect(user).toBeDefined();
  });

  it('should link accounts if the email already exists', async () => {
    await User.create({
      username: 'Existing User',
      email: 'link@example.com',
      passwordHash: 'hashed_password',
    });

    const mockProfile = {
      id: 'gh-678',
      emails: [{ value: 'link@example.com' }],
      username: 'githubuser',
    };

    const done = vi.fn();
    await handleOAuthLogin('githubId', mockProfile as Parameters<typeof handleOAuthLogin>[1], done);

    const updatedUser = await User.findOne({ email: 'link@example.com' });
    expect(updatedUser?.githubId).toBe('gh-678');
    expect(updatedUser?.username).toBe('Existing User');
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
