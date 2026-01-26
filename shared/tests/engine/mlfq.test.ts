import { describe, expect, it } from 'vitest';
import { runMLFQ } from '../../src/engine/mlfq';
import { Process } from '../../src/types';

describe('MLFQ Scheduling', () => {
  it('should run short job in Q0 without demotion', () => {
    // P1: Burst 2. Q0 Quantum = 2.
    // Should run 0-2 and finish.
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 2 },
    ];
    
    const { events } = runMLFQ(processes);
    
    expect(events.length).toBe(1);
    expect(events[0].pid).toBe('P1');
    expect(events[0].end).toBe(2);
  });

  it('should demote long job Q0 -> Q1 -> Q2', () => {
    // P1: Burst 10.
    // Q0 (Q=2) -> Runs 2 ticks -> Demoted to Q1
    // Q1 (Q=4) -> Runs 4 ticks -> Demoted to Q2
    // Q2 (FCFS) -> Runs remaining 4 ticks -> Finishes
    
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 10 },
    ];
    
    const { events } = runMLFQ(processes);
    
    // t=0-2: Q0 (P1)
    // t=2-6: Q1 (P1)
    // t=6-10: Q2 (P1)
    // My implementation merges consecutive events for same PID.
    // So it should be just one event 0-10.
    
    expect(events[0].pid).toBe('P1');
    expect(events[0].end).toBe(10);
  });

  it('should preempt lower queue when new process arrives', () => {
    // P1: Arrives 0, Burst 10.
    // P2: Arrives 4, Burst 1.
    
    // t=0: P1 starts in Q0.
    // t=2: P1 demoted to Q1.
    // t=2: P1 runs in Q1.
    // t=4: P2 arrives in Q0. P1 (in Q1) preempted.
    // t=4-5: P2 runs in Q0 (Burst 1 < Q=2). Finishes.
    // t=5: P1 resumes in Q1.
    
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 10 },
      { pid: 'P2', arrival: 4, burst: 1 },
    ];
    
    const { events } = runMLFQ(processes);
    
    expect(events[0].pid).toBe('P1');
    expect(events[0].start).toBe(0);
    expect(events[0].end).toBe(4); // P1 ran in Q0(2) then Q1(2) -> Total 4
    
    expect(events[1].pid).toBe('P2');
    expect(events[1].start).toBe(4);
    expect(events[1].end).toBe(5); // P2 runs 1 unit
    
    expect(events[2].pid).toBe('P1');
    expect(events[2].start).toBe(5);
    expect(events[2].end).toBe(11); // P1 had 6 left (10-4). 5+6=11.
  });
});
