import { describe, expect, it } from 'vitest';
import { runMQ } from '../../src/engine/mq';
import { Process } from '../../src/types';

describe('Multilevel Queue (MQ) Scheduling', () => {
  it('should prioritize Q1 (RR) over Q2 (FCFS)', () => {
    // P1: Priority 1 (High/RR), Arrival 0, Burst 4
    // P2: Priority 2 (Low/FCFS), Arrival 0, Burst 2
    // Quantum = 2
    
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 4, priority: 1 },
      { pid: 'P2', arrival: 0, burst: 2, priority: 2 },
    ];

    const { events } = runMQ(processes, { quantum: 2 });

    // Expected:
    // Q1 has P1. Q2 has P2.
    // Q1 runs P1 (RR quantum 2).
    // t=0-2: P1. Rem=2. P1 moves to back of Q1 (still only P1).
    // Q1 not empty. Runs P1 again.
    // t=2-4: P1. Rem=0. Done.
    // Q1 empty. Q2 runs P2.
    // t=4-6: P2. Rem=0. Done.

    expect(events[0].pid).toBe('P1');
    expect(events[0].start).toBe(0);
    // Depending on event merging, P1 might be 0-4 or 0-2 then 2-4.
    // My implementation merges consecutive events if same PID.
    // So 0-4 P1, then 4-6 P2.
    
    // Wait, let's verify if implementation merges events properly.
    // Yes, Step 6 does: "if (lastEvent && lastEvent.pid === currentProcess.pid)"
    
    expect(events[0].end).toBe(4);
    
    expect(events[1].pid).toBe('P2');
    expect(events[1].start).toBe(4);
    expect(events[1].end).toBe(6);
  });

  it('should preempt Q2 when process arrives in Q1', () => {
    // P1: Prio 2 (Low), Arrive 0, Burst 5
    // P2: Prio 1 (High), Arrive 2, Burst 1
    
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 5, priority: 2 },
      { pid: 'P2', arrival: 2, burst: 1, priority: 1 },
    ];
    
    const { events } = runMQ(processes);
    
    // t=0: Q1 empty. Q2 has P1. P1 runs.
    // t=0-2: P1 runs.
    // t=2: P2 arrives in Q1. Q1 has [P2]. Q2 has [P1].
    // Scheduler checks Q1 first. P2 selected. P1 preempted.
    // t=2-3: P2 runs (burst 1). Done.
    // t=3: Q1 empty. Q2 has P1. P1 runs.
    // t=3-6: P1 runs (Rem 3).
    
    expect(events[0].pid).toBe('P1');
    expect(events[0].end).toBe(2);
    
    expect(events[1].pid).toBe('P2');
    expect(events[1].start).toBe(2);
    expect(events[1].end).toBe(3);
    
    expect(events[2].pid).toBe('P1');
    expect(events[2].start).toBe(3);
    expect(events[2].end).toBe(6);
  });
});
