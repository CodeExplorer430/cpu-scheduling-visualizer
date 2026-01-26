import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from '../app.js';
import { connectDB } from '../db/index.js';

dotenv.config();

describe('Scenarios API Tests', () => {
  let token = '';

  beforeAll(async () => {
    await connectDB();
    // Create a user to get a token
    const testUser = {
      username: 'scenario_user_' + Date.now(),
      email: 'scenario' + Date.now() + '@example.com',
      password: 'password123',
    };
    const res = await request(app).post('/api/auth/register').send(testUser);
    token = res.body.token;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('POST /api/scenarios should create a new scenario', async () => {
    const scenario = {
      name: 'Test Scenario',
      description: 'Test Description',
      processes: [{ pid: 'P1', arrival: 0, burst: 5 }],
    };

    const res = await request(app)
      .post('/api/scenarios')
      .set('Authorization', `Bearer ${token}`)
      .send(scenario);

    expect(res.status).toBe(201);
    expect(res.body.name).toBe(scenario.name);
    expect(res.body.userId).toBeDefined();
  });

  it('GET /api/scenarios should list user scenarios', async () => {
    const res = await request(app).get('/api/scenarios').set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('GET /api/scenarios should fail without token', async () => {
    const res = await request(app).get('/api/scenarios');
    expect(res.status).toBe(401);
  });
});
