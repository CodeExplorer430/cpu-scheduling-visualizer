import { describe, it, expect } from 'vitest';
import Scenario from '../../models/Scenario.js';

interface ValidationError {
  errors: Record<string, unknown>;
}

describe('Scenario Model', () => {
  it('should be invalid if name is empty', async () => {
    const scenario = new Scenario({ processes: [] });
    let err: ValidationError | null = null;
    try {
      await scenario.validate();
    } catch (e) {
      err = e as ValidationError;
    }
    expect(err?.errors.name).toBeDefined();
  });

  it('should be invalid if processes array is empty', async () => {
    const scenario = new Scenario({ name: 'Test Scenario', processes: [] });
    let err: ValidationError | null = null;
    try {
      await scenario.validate();
    } catch (e) {
      err = e as ValidationError;
    }
    expect(err?.errors.processes).toBeDefined();
  });

  it('should have a default createdAt date', () => {
    const scenario = new Scenario({ name: 'Test Scenario', processes: [] });
    expect(scenario.createdAt).toBeDefined();
    expect(scenario.createdAt instanceof Date).toBe(true);
  });

  it('should allow optional userId and description', async () => {
    const scenario = new Scenario({
      name: 'Test Scenario',
      processes: [{ pid: 'P1', arrival: 0, burst: 5 }],
    });
    let err: ValidationError | null = null;
    try {
      await scenario.validate();
    } catch (e) {
      err = e as ValidationError;
    }
    expect(err).toBeNull();
  });
});
