import { describe, it, expect } from 'vitest';
import { runEDF } from '../../src/engine/edf.js';
import { Process } from '../../src/types.js';

describe('EDF Scheduling', () => {
  it('should preempt for earlier deadline arrivals', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 4, deadline: 10 },
      { pid: 'P2', arrival: 1, burst: 2, deadline: 3 },
    ];

    const result = runEDF(processes);

    expect(result.events[0]).toEqual({ pid: 'P1', start: 0, end: 1, coreId: 0 });
    expect(result.events[1]).toEqual({ pid: 'P2', start: 1, end: 3, coreId: 0 });
  });

  it('should use fallback deadline when omitted', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 3 },
      { pid: 'P2', arrival: 0, burst: 1 },
    ];

    const result = runEDF(processes);
    expect(result.metrics.completion.P1).toBeDefined();
    expect(result.metrics.completion.P2).toBeDefined();
  });
});
