import { describe, it, expect } from 'vitest';
import { User } from '../../models/User.js';

interface ValidationError {
  errors: Record<string, unknown>;
}

describe('User Model', () => {
  it('should be invalid if username is empty', async () => {
    const user = new User({ email: 'test@example.com' });
    let err: ValidationError | null = null;
    try {
      await user.validate();
    } catch (e) {
      err = e as ValidationError;
    }
    expect(err?.errors.username).toBeDefined();
  });

  it('should be invalid if email is empty', async () => {
    const user = new User({ username: 'testuser' });
    let err: ValidationError | null = null;
    try {
      await user.validate();
    } catch (e) {
      err = e as ValidationError;
    }
    expect(err?.errors.email).toBeDefined();
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
