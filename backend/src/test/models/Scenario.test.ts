import { describe, it, expect } from 'vitest';
import Scenario from '../../models/Scenario.js';

describe('Scenario Model', () => {
  it('should be invalid if name is empty', async () => {
    const scenario = new Scenario({ processes: [] });
    let err: any;
    try {
      await scenario.validate();
    } catch (e: any) {
      err = e;
    }
    expect(err.errors.name).toBeDefined();
  });

  it('should be invalid if processes array is empty', async () => {
    const scenario = new Scenario({ name: 'Test Scenario', processes: [] });
    let err: any;
    try {
      await scenario.validate();
    } catch (e: any) {
      err = e;
    }
    expect(err.errors.processes).toBeDefined();
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
    let err: any;
    try {
      await scenario.validate();
    } catch (e: any) {
      err = e;
    }
    expect(err).toBeUndefined();
  });
});
