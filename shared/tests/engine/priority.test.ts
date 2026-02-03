import { describe, it, expect } from 'vitest';
import { runPriority } from '../../src/engine/priority.js';
import { Process } from '../../src/types.js';

describe('Priority Scheduling (Non-Preemptive)', () => {
  it('should schedule higher priority (lower number) first', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 5, priority: 2 },
      { pid: 'P2', arrival: 0, burst: 2, priority: 1 }, // Higher priority
    ];

    const result = runPriority(processes);
    const { events } = result;

    expect(events[0].pid).toBe('P2');
    expect(events[1].pid).toBe('P1');
  });

  it('should fallback to FCFS for equal priority', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 2, priority: 1 },
      { pid: 'P2', arrival: 0, burst: 2, priority: 1 },
    ];

    const result = runPriority(processes);
    const { events } = result;

    expect(events[0].pid).toBe('P1');
    expect(events[1].pid).toBe('P2');
  });

  it('should handle non-preemptive behavior', () => {
    // P1 runs. P2 arrives with higher priority. P1 should finish first.
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 10, priority: 2 },
      { pid: 'P2', arrival: 2, burst: 2, priority: 1 },
    ];

    const result = runPriority(processes);
    const { events } = result;

    expect(events[0]).toEqual({ pid: 'P1', start: 0, end: 10, coreId: 0 });
    expect(events[1]).toEqual({ pid: 'P2', start: 10, end: 12, coreId: 0 });
  });
});
