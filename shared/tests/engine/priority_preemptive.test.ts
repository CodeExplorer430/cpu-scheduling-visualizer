import { describe, expect, it } from 'vitest';
import { runPriorityPreemptive } from '../../src/engine/priority_preemptive.js';
import { Process } from '../../src/types.js';

describe('Preemptive Priority Scheduling', () => {
  it('should preempt lower priority process when higher priority arrives', () => {
    // P1: Priority 2 (Lower), Arrival 0, Burst 4
    // P2: Priority 1 (Higher), Arrival 1, Burst 1
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 4, priority: 2 },
      { pid: 'P2', arrival: 1, burst: 1, priority: 1 },
    ];

    const { events } = runPriorityPreemptive(processes);

    // Expected:
    // 0-1: P1 runs (Rem: 3)
    // At 1: P2 arrives (Prio 1 < 2). P1 preempted.
    // 1-2: P2 runs (Rem: 0). Completes.
    // 2-5: P1 runs (Rem: 0). Completes.

    expect(events.length).toBe(3);

    expect(events[0].pid).toBe('P1');
    expect(events[0].start).toBe(0);
    expect(events[0].end).toBe(1);

    expect(events[1].pid).toBe('P2');
    expect(events[1].start).toBe(1);
    expect(events[1].end).toBe(2);

    expect(events[2].pid).toBe('P1');
    expect(events[2].start).toBe(2);
    expect(events[2].end).toBe(5);
  });

  it('should behave like non-preemptive if priorities are same', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 4, priority: 1 },
      { pid: 'P2', arrival: 1, burst: 1, priority: 1 },
    ];

    // P1 starts. P2 arrives at 1. P2 priority (1) is NOT < P1 priority (1).
    // P1 continues.

    const { events } = runPriorityPreemptive(processes);

    expect(events[0].pid).toBe('P1');
    expect(events[0].end).toBe(4);

    expect(events[1].pid).toBe('P2');
    expect(events[1].start).toBe(4);
  });
});
