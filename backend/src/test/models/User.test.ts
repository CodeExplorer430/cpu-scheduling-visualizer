import { describe, it, expect, vi, beforeAll } from 'vitest';
import mongoose from 'mongoose';
import { User } from '../../models/User.js';

describe('User Model', () => {
  it('should be invalid if username is empty', async () => {
    const user = new User({ email: 'test@example.com' });
    let err: any;
    try {
        await user.validate();
    } catch (e) {
        err = e;
    }
    expect(err.errors.username).toBeDefined();
  });

  it('should be invalid if email is empty', async () => {
    const user = new User({ username: 'testuser' });
    let err: any;
    try {
        await user.validate();
    } catch (e) {
        err = e;
    }
    expect(err.errors.email).toBeDefined();
  });

  it('should have a default createdAt date', () => {
    const user = new User({ username: 'testuser', email: 'test@example.com' });
    expect(user.createdAt).toBeDefined();
    expect(user.createdAt instanceof Date).toBe(true);
  });

  it('should trim username and email', () => {
      const user = new User({ username: '  testuser  ', email: '  TEST@example.com  ' });
      expect(user.username).toBe('testuser');
      expect(user.email).toBe('test@example.com'); // also lowercased
  });
});
