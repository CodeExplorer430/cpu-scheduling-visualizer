import { describe, it, expect } from 'vitest';
import { runSRTF } from '../../src/engine/srtf.js';
import { Process } from '../../src/types.js';

describe('SRTF (Shortest Remaining Time First - Preemptive SJF)', () => {
  it('should preempt current process if shorter job arrives', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 10 },
      { pid: 'P2', arrival: 2, burst: 2 }, // Shorter than P1's remaining (8)
    ];

    const result = runSRTF(processes);
    const { events } = result;

    // Timeline:
    // t=0: Ready=[P1(10)]. Start P1.
    // t=2: P1 has 8 left. P2 arrives with 2. 2 < 8. Preempt P1.
    // Run P2 (2-4).
    // t=4: P2 done. Ready=[P1(8)]. Resume P1.
    // t=12: P1 done.

    expect(events[0]).toEqual({ pid: 'P1', start: 0, end: 2 });
    expect(events[1]).toEqual({ pid: 'P2', start: 2, end: 4 });
    expect(events[2]).toEqual({ pid: 'P1', start: 4, end: 12 });
  });

  it('should not preempt if arriving job is longer than remaining time', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 5 },
      { pid: 'P2', arrival: 2, burst: 10 }, // 10 > (5-2)=3
    ];

    const result = runSRTF(processes);
    const { events } = result;

    // P1 runs 0-5 uninterrupted.
    // P2 runs 5-15.

    expect(events[0]).toEqual({ pid: 'P1', start: 0, end: 5 });
    expect(events[1]).toEqual({ pid: 'P2', start: 5, end: 15 });
  });
});
