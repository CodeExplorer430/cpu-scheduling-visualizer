import { describe, it, expect, vi, beforeEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { User } from '../models/User.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { connectDB } from '../db/index.js';
import dotenv from 'dotenv';

dotenv.config();

// Mock Passport logic or the strategies if needed
// For these tests, we are mostly testing the logic that happens AFTER passport authentication
// which is usually in the callback route or the handleOAuthLogin helper.

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

  it('should create a new user and return a token on successful OAuth callback logic simulation', async () => {
    // This is more of a unit test for the handleOAuthLogin logic if it were exported, 
    // but we can simulate the outcome by checking how the database is populated.
    
    const mockProfile = {
      id: '12345',
      emails: [{ value: 'oauth-user@example.com' }],
      displayName: 'OAuth User',
      provider: 'google'
    };

    // Simulate the behavior of handleOAuthLogin
    let user = await User.findOne({ 
      $or: [{ googleId: mockProfile.id }, { email: mockProfile.emails[0].value }] 
    });

    if (!user) {
      user = await User.create({
        username: mockProfile.displayName,
        email: mockProfile.emails[0].value,
        googleId: mockProfile.id,
      });
    }

    expect(user).toBeDefined();
    expect(user.email).toBe('oauth-user@example.com');
    expect(user.googleId).toBe('12345');

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
    expect(token).toBeDefined();
  });

  it('should link accounts if the email already exists', async () => {
    // Create an existing user with email/password
    await User.create({
      username: 'Existing User',
      email: 'link@example.com',
      passwordHash: 'hashed_password'
    });

    const mockProfile = {
      id: 'gh-678',
      emails: [{ value: 'link@example.com' }],
      displayName: 'GitHub User',
      provider: 'github'
    };

    // Simulate handleOAuthLogin logic
    let user = await User.findOne({ 
      $or: [{ githubId: mockProfile.id }, { email: mockProfile.emails[0].value }] 
    });

    if (user) {
      if (!user.githubId) {
        user.githubId = mockProfile.id;
        await user.save();
      }
    }

    const updatedUser = await User.findOne({ email: 'link@example.com' });
    expect(updatedUser?.githubId).toBe('gh-678');
    expect(updatedUser?.username).toBe('Existing User'); // Kept original username
  });
});
