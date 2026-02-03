import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import { connectDB } from '../db/index.js';
import { JWT_SECRET } from '../config/index.js';
import { User } from '../models/User.js';

dotenv.config();

describe('Auth API Tests', () => {
  const testUser = {
    username: 'testuser_' + Date.now(),
    email: 'test' + Date.now() + '@example.com',
    password: 'password123',
  };

  let token = '';

  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    // Clean up test user
    await User.deleteOne({ email: testUser.email });
    await mongoose.connection.close();
  });

  it('POST /api/auth/register should create a new user', async () => {
    const res = await request(app).post('/api/auth/register').send(testUser);

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user.username).toBe(testUser.username);
    token = res.body.token;
  });

  it('POST /api/auth/login should authenticate user', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: testUser.email,
      password: testUser.password,
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    token = res.body.token;
  });

  it('GET /api/auth/me should return user profile', async () => {
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.username).toBe(testUser.username);
    expect(res.body).not.toHaveProperty('passwordHash');
  });

  it('GET /api/auth/me should fail without token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  describe('Magic Link Tests', () => {
    it('POST /api/auth/magic-link should send link', async () => {
      const res = await request(app).post('/api/auth/magic-link').send({ email: testUser.email });

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/sent/i);
    });

    it('POST /api/auth/magic-link/verify should authenticate with valid token', async () => {
      // Create a valid token manually since we can't intercept the email/console
      const user = await User.findOne({ email: testUser.email });
      const magicToken = jwt.sign({ userId: user?._id, type: 'magic_link' }, JWT_SECRET, {
        expiresIn: '15m',
      });

      const res = await request(app)
        .post('/api/auth/magic-link/verify')
        .send({ token: magicToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('POST /api/auth/magic-link/verify should fail with invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/magic-link/verify')
        .send({ token: 'invalid.token.here' });

      expect(res.status).toBe(401); // or 500 depending on implementation, usually 401/400
    });
  });
});
