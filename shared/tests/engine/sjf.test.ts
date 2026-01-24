import { describe, it, expect } from 'vitest';
import { runSJF } from '../../src/engine/sjf.js';
import { Process } from '../../src/types.js';

describe('SJF (Shortest Job First - Non-Preemptive)', () => {
  it('should schedule shortest job first when all arrive at 0', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 5 },
      { pid: 'P2', arrival: 0, burst: 2 },
      { pid: 'P3', arrival: 0, burst: 8 },
    ];

    const result = runSJF(processes);
    const { events } = result;

    // Expected order: P2 (2), P1 (5), P3 (8)
    expect(events[0].pid).toBe('P2');
    expect(events[1].pid).toBe('P1');
    expect(events[2].pid).toBe('P3');

    expect(events[0].end).toBe(2);
    expect(events[1].end).toBe(7); // 2+5
    expect(events[2].end).toBe(15); // 7+8
  });

  it('should not preempt running process even if shorter job arrives (Non-Preemptive)', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 10 },
      { pid: 'P2', arrival: 2, burst: 2 }, // Arrives while P1 is running
    ];

    const result = runSJF(processes);
    const { events } = result;

    // P1 starts at 0. Since it's non-preemptive, it runs until 10.
    // P2 runs after P1.

    expect(events[0]).toEqual({ pid: 'P1', start: 0, end: 10 });
    expect(events[1]).toEqual({ pid: 'P2', start: 10, end: 12 });
  });

  it('should handle idle time', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 2 },
      { pid: 'P2', arrival: 4, burst: 2 },
    ];
    const result = runSJF(processes);
    expect(result.events[1].pid).toBe('IDLE');
  });
});
