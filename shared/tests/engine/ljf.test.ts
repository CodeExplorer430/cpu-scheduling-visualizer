import { describe, expect, it } from 'vitest';
import { runLJF } from '../../src/engine/ljf';
import { Process } from '../../src/types';

describe('LJF Scheduling', () => {
  it('should schedule longer jobs first when they arrive at the same time', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 2 },
      { pid: 'P2', arrival: 0, burst: 5 },
      { pid: 'P3', arrival: 0, burst: 3 },
    ];

    const { events } = runLJF(processes);

    // Expected order: P2 (5), P3 (3), P1 (2)
    expect(events[0].pid).toBe('P2');
    expect(events[1].pid).toBe('P3');
    expect(events[2].pid).toBe('P1');
  });

  it('should handle arrivals correctly', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 2 }, // Runs first (0-2)
      { pid: 'P2', arrival: 1, burst: 5 }, // Arrives at 1, waits
      { pid: 'P3', arrival: 3, burst: 1 }, // Arrives at 3
    ];

    // Execution:
    // 0-2: P1 (Ready: P1) -> P1 finishes at 2.
    // At 2: Ready Queue: [P2 (Burst 5)]. P2 starts.
    // 2-7: P2 runs. P3 arrives at 3.
    // At 7: Ready Queue: [P3]. P3 starts.
    
    const { events } = runLJF(processes);
    
    expect(events[0].pid).toBe('P1');
    expect(events[1].pid).toBe('P2');
    expect(events[2].pid).toBe('P3');
  });

  it('should respect idle time', () => {
     const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 1 },
      { pid: 'P2', arrival: 2, burst: 1 },
    ];
    
    const { events } = runLJF(processes);
    
    expect(events[0].pid).toBe('P1');
    expect(events[1].pid).toBe('IDLE');
    expect(events[2].pid).toBe('P2');
  });
});
