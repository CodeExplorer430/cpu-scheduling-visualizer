import { describe, it, expect } from 'vitest';
import { validateProcesses } from '../src/validators.js';

describe('Validators', () => {
  it('should validate correct processes', () => {
    const processes = [
      { pid: 'P1', arrival: 0, burst: 5 },
      { pid: 'P2', arrival: 2, burst: 3, priority: 1 },
    ];
    const result = validateProcesses(processes);
    expect(result.valid).toBe(true);
  });

  it('should fail on negative burst', () => {
    const processes = [{ pid: 'P1', arrival: 0, burst: -1 }];
    const result = validateProcesses(processes);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Invalid burst');
  });

  it('should fail on duplicate PIDs', () => {
    const processes = [
      { pid: 'P1', arrival: 0, burst: 5 },
      { pid: 'P1', arrival: 2, burst: 3 },
    ];
    const result = validateProcesses(processes);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Duplicate PID');
  });

  it('should fail on non-array input', () => {
    expect(validateProcesses(null).valid).toBe(false);
    expect(validateProcesses({}).valid).toBe(false);
  });
});
