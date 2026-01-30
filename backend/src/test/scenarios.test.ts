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

  it('PATCH /api/scenarios/:id should update a scenario', async () => {
    // First create one
    const createRes = await request(app)
      .post('/api/scenarios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'To Update',
        processes: [{ pid: 'P1', arrival: 0, burst: 1 }],
      });

    const id = createRes.body._id;

    const res = await request(app)
      .patch(`/api/scenarios/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Updated Name' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Updated Name');
  });

  it('DELETE /api/scenarios/:id should delete a scenario', async () => {
    // First create one
    const createRes = await request(app)
      .post('/api/scenarios')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'To Delete',
        processes: [{ pid: 'P1', arrival: 0, burst: 1 }],
      });

    const id = createRes.body._id;

    const res = await request(app)
      .delete(`/api/scenarios/${id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);

    // Verify it's gone
    const checkRes = await request(app)
      .get(`/api/scenarios/${id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(checkRes.status).toBe(404);
  });
});
