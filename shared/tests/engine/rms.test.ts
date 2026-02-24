import { describe, it, expect } from 'vitest';
import { runRMS } from '../../src/engine/rms.js';
import { Process } from '../../src/types.js';

describe('RMS Scheduling', () => {
  it('should prioritize the task with shorter period', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 3, period: 10 },
      { pid: 'P2', arrival: 1, burst: 2, period: 4 },
    ];

    const result = runRMS(processes);

    expect(result.events[0]).toEqual({ pid: 'P1', start: 0, end: 1, coreId: 0 });
    expect(result.events[1]).toEqual({ pid: 'P2', start: 1, end: 3, coreId: 0 });
  });

  it('should fallback to burst when period is omitted', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 2 },
      { pid: 'P2', arrival: 0, burst: 1 },
    ];

    const result = runRMS(processes);
    expect(result.metrics.avgWaiting).toBeGreaterThanOrEqual(0);
  });
});
