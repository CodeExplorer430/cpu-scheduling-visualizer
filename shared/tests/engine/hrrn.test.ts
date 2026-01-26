import { describe, expect, it } from 'vitest';
import { runHRRN } from '../../src/engine/hrrn.js';
import { Process } from '../../src/types.js';

describe('HRRN Scheduling', () => {
  it('should select process with highest response ratio', () => {
    // P1 arrives at 0, burst 3
    // P2 arrives at 1, burst 2
    // P3 arrives at 2, burst 5
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 3 },
      { pid: 'P2', arrival: 1, burst: 2 },
      { pid: 'P3', arrival: 2, burst: 5 },
    ];

    // At t=0, only P1 is ready. P1 runs from 0-3.
    // At t=3, P2 and P3 are ready.
    // P2: Wait = 3-1 = 2. Burst = 2. RR = (2+2)/2 = 2.0
    // P3: Wait = 3-2 = 1. Burst = 5. RR = (1+5)/5 = 1.2
    // P2 should be selected.

    const { events } = runHRRN(processes);

    expect(events[0].pid).toBe('P1');
    expect(events[1].pid).toBe('P2');
    expect(events[2].pid).toBe('P3');
  });

  it('should prevent starvation by increasing priority over time', () => {
    // P1: arrives 0, burst 10 (Long job)
    // P2: arrives 1, burst 1
    // P3: arrives 2, burst 1
    // P4: arrives 5, burst 5
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 10 },
      { pid: 'P2', arrival: 1, burst: 1 },
      { pid: 'P3', arrival: 2, burst: 1 },
    ];

    // 0-10: P1 runs.
    // At t=10:
    // P2: Wait = 9. Burst = 1. RR = (9+1)/1 = 10.0
    // P3: Wait = 8. Burst = 1. RR = (8+1)/1 = 9.0
    // P2 runs 10-11.
    // At t=11:
    // P3: Wait = 9. Burst = 1. RR = (9+1)/1 = 10.0

    const { events } = runHRRN(processes);
    expect(events[0].pid).toBe('P1');
    expect(events[1].pid).toBe('P2');
    expect(events[2].pid).toBe('P3');
  });
});
