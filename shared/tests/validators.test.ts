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

  it('should validate advanced scheduling fields', () => {
    const processes = [
      {
        pid: 'P1',
        arrival: 0,
        burst: 5,
        tickets: 5,
        shareGroup: 'team-a',
        shareWeight: 2,
        deadline: 8,
        period: 4,
      },
    ];
    const result = validateProcesses(processes);
    expect(result.valid).toBe(true);
  });

  it('should fail on invalid tickets', () => {
    const result = validateProcesses([{ pid: 'P1', arrival: 0, burst: 2, tickets: 0 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('tickets');
  });

  it('should fail when deadline is before arrival', () => {
    const result = validateProcesses([{ pid: 'P1', arrival: 3, burst: 2, deadline: 2 }]);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Deadline');
  });
});
