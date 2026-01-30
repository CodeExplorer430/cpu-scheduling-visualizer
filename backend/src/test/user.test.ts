import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../app.js';
import { connectDB } from '../db/index.js';

dotenv.config();

describe('User API Tests', () => {
  let token = '';

  beforeAll(async () => {
    await connectDB();
    const testUser = {
      username: 'user_test_' + Date.now(),
      email: 'user' + Date.now() + '@example.com',
      password: 'password123',
    };
    const res = await request(app).post('/api/auth/register').send(testUser);
    token = res.body.token;
  }, 30000);

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('PATCH /api/user/profile should update profile', async () => {
    const res = await request(app)
      .patch('/api/user/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({ bio: 'New Bio', username: 'updated_user_' + Date.now() });

    expect(res.status).toBe(200);
    expect(res.body.profile.bio).toBe('New Bio');
  });

  it('PATCH /api/user/settings should update settings', async () => {
    const res = await request(app)
      .patch('/api/user/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ theme: 'dark', language: 'es' });

    expect(res.status).toBe(200);
    expect(res.body.theme).toBe('dark');
    expect(res.body.language).toBe('es');
  });

  it('GET /api/user/analytics should return analytics data', async () => {
    // Run a simulation first to have some data
    await request(app)
      .post('/api/simulate')
      .set('Authorization', `Bearer ${token}`)
      .send({
        algorithm: 'FCFS',
        processes: [{ pid: 'P1', arrival: 0, burst: 1 }],
      });

    const res = await request(app)
      .get('/api/user/analytics')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.history).toBeDefined();
    expect(res.body.stats).toBeDefined();
  });
});
