import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { runSJF } from '../../src/engine/sjf.js';
import { GanttEvent } from '../../src/types.js';

describe('SJF Property Tests', () => {
  it('should maintain basic invariants', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            pid: fc.uuid(),
            arrival: fc.integer({ min: 0, max: 100 }),
            burst: fc.integer({ min: 1, max: 50 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (processesInput) => {
          const processes = processesInput.map((p, i) => ({ ...p, pid: `${p.pid}-${i}` }));
          const result = runSJF(processes);
          const { events, metrics } = result;

          // All complete
          expect(Object.keys(metrics.completion).length).toBe(processes.length);

          // SJF Logic: If we pick a process, no other ready process should have a shorter burst
          // This is harder to check from Gantt alone without knowing ready queue at each step,
          // but we can check it at start times.
          const startTimes: Record<string, number> = {};
          events.forEach((e: GanttEvent) => {
            if (e.pid !== 'IDLE' && e.pid !== 'CS') {
              if (startTimes[e.pid] === undefined) startTimes[e.pid] = e.start;
            }
          });

          Object.entries(startTimes).forEach(([pid, start]) => {
            const p = processes.find((proc) => proc.pid === pid)!;
            // Check all other processes that arrived before or at 'start' but haven't started yet
            processes.forEach((other) => {
              if (other.pid !== pid && other.arrival <= start) {
                const otherStart = startTimes[other.pid];
                if (otherStart > start) {
                  // 'other' was ready but 'p' was picked.
                  // So p.burst should be <= other.burst (or p arrived earlier if bursts equal)
                  if (p.burst > other.burst) {
                    // This is only a violation if 'other' had actually arrived by the time 'p' was selected.
                    // FCFS/SJF selection happens at the moment the core becomes free.
                    // Let's find when the core became free.
                    // For SJF (non-preemptive), it's the start time of the process.
                    expect(p.burst).toBeLessThanOrEqual(other.burst);
                  }
                }
              }
            });
          });
        }
      )
    );
  });
});
