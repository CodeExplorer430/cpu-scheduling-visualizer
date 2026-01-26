import { describe, it, expect } from 'vitest';
import { runRR } from '../../src/engine/rr.js';
import { Process } from '../../src/types.js';

describe('Round Robin (RR) Algorithm', () => {
  it('should execute processes in round robin fashion with quantum', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 4 }, // 2 then 2
      { pid: 'P2', arrival: 0, burst: 3 }, // 2 then 1
    ];
    // Quantum = 2

    const result = runRR(processes, 2);
    const { events, metrics } = result;

    // Expected Gantt:
    // P1: 0-2 (rem: 2) -> Queue: [P2, P1]
    // P2: 2-4 (rem: 1) -> Queue: [P1, P2]
    // P1: 4-6 (rem: 0) -> Done. Queue: [P2]
    // P2: 6-7 (rem: 0) -> Done.

    expect(events).toHaveLength(4);
    expect(events[0]).toEqual({ pid: 'P1', start: 0, end: 2 });
    expect(events[1]).toEqual({ pid: 'P2', start: 2, end: 4 });
    expect(events[2]).toEqual({ pid: 'P1', start: 4, end: 6 });
    expect(events[3]).toEqual({ pid: 'P2', start: 6, end: 7 });

    // Completion times
    expect(metrics.completion['P1']).toBe(6);
    expect(metrics.completion['P2']).toBe(7);

    // Turnaround
    // P1: 6-0 = 6
    // P2: 7-0 = 7
    expect(metrics.turnaround['P1']).toBe(6);
    expect(metrics.turnaround['P2']).toBe(7);
  });

  it('should handle arrival times correctly', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 4 },
      { pid: 'P2', arrival: 1, burst: 5 },
    ];
    // Quantum = 2

    const result = runRR(processes, 2);
    const { events } = result;

    // Timeline:
    // t=0: Ready=[P1]. Run P1 (0-2).
    // t=1: P2 arrives. Ready=[P1, P2].
    // t=2: P1 done with slice (rem=2). Ready=[P2, P1].
    // Run P2 (2-4). rem=3.
    // t=4: Ready=[P1, P2]. Run P1 (4-6). rem=0. Done.
    // t=6: Ready=[P2]. Run P2 (6-8). rem=1.
    // t=8: Ready=[P2]. Run P2 (8-9). Done.
    // Note: The implementation no longer merges consecutive events for the same PID
    // in RR to allow visual stepping of quantums.

    expect(events).toHaveLength(5);
    expect(events[0]).toEqual({ pid: 'P1', start: 0, end: 2 });
    expect(events[1]).toEqual({ pid: 'P2', start: 2, end: 4 });
    expect(events[2]).toEqual({ pid: 'P1', start: 4, end: 6 });
    expect(events[3]).toEqual({ pid: 'P2', start: 6, end: 8 });
    expect(events[4]).toEqual({ pid: 'P2', start: 8, end: 9 });
  });

  it('should handle idle time correctly', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 2 },
      { pid: 'P2', arrival: 5, burst: 2 },
    ];
    // Quantum = 2

    const result = runRR(processes, 2);
    const { events } = result;

    // P1: 0-2
    // IDLE: 2-5
    // P2: 5-7

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ pid: 'P1', start: 0, end: 2 });
    expect(events[1]).toEqual({ pid: 'IDLE', start: 2, end: 5 });
    expect(events[2]).toEqual({ pid: 'P2', start: 5, end: 7 });
  });
});
