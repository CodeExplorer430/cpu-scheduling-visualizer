import { describe, expect, it } from 'vitest';
import { runLRTF } from '../../src/engine/lrtf';
import { Process } from '../../src/types';

describe('LRTF Scheduling', () => {
  it('should preempt when another process has longer remaining time', () => {
    // P1: arrives 0, burst 3
    // P2: arrives 1, burst 4
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 3 },
      { pid: 'P2', arrival: 1, burst: 4 },
    ];

    const { events } = runLRTF(processes);

    // t=0: P1 (Rem 3) starts.
    // t=1: P1 (Rem 2), P2 (Rem 4). P2 has more remaining. P2 starts.
    // t=2: P1 (Rem 2), P2 (Rem 3). P2 has more.
    // t=3: P1 (Rem 2), P2 (Rem 2). Tie! P1 arrived earlier. P1 starts.
    // t=4: P1 (Rem 1), P2 (Rem 2). P2 has more. P2 starts.
    // t=5: P1 (Rem 1), P2 (Rem 1). Tie! P1 starts.
    // t=6: P1 (Rem 0), P2 (Rem 1). P2 starts.
    // t=7: Completed.

    expect(events[0].pid).toBe('P1');
    expect(events[0].end).toBe(1);

    expect(events[1].pid).toBe('P2');
    expect(events[1].start).toBe(1);
    expect(events[1].end).toBe(3);

    expect(events[2].pid).toBe('P1');
    expect(events[2].start).toBe(3);
    expect(events[2].end).toBe(4);

    expect(events[3].pid).toBe('P2');
    expect(events[3].start).toBe(4);
    expect(events[3].end).toBe(5);

    expect(events[4].pid).toBe('P1');
    expect(events[5].pid).toBe('P2');
  });

  it('should handle multiple processes with equal remaining time by arrival', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 2 },
      { pid: 'P2', arrival: 0, burst: 2 },
    ];

    const { events } = runLRTF(processes);

    // t=0: P1, P2 both have 2. P1 arrived first (or index 0).
    // t=0-1: P1 runs (Rem 1).
    // t=1: P1 (Rem 1), P2 (Rem 2). P2 now has more. P2 runs.
    // t=1-2: P2 runs (Rem 1).
    // t=2: P1 (Rem 1), P2 (Rem 1). Both equal, P1 arrives first. P1 runs.

    expect(events.length).toBe(4);
    expect(events[0].pid).toBe('P1');
    expect(events[1].pid).toBe('P2');
    expect(events[2].pid).toBe('P1');
    expect(events[3].pid).toBe('P2');
  });
});
