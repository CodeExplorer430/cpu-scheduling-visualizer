import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { runPriority } from '../../src/engine/priority.js';
import { GanttEvent } from '../../src/types.js';

describe('Priority Property Tests', () => {
  it('should respect priority order', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            pid: fc.uuid(),
            arrival: fc.integer({ min: 0, max: 100 }),
            burst: fc.integer({ min: 1, max: 50 }),
            priority: fc.integer({ min: 1, max: 10 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (processesInput) => {
          const processes = processesInput.map((p, i) => ({ ...p, pid: `${p.pid}-${i}` }));
          const result = runPriority(processes);
          const { events, metrics } = result;

          expect(Object.keys(metrics.completion).length).toBe(processes.length);

          // Priority Invariant: If P1 is picked over P2 at time t,
          // then P1.priority <= P2.priority (or P1 arrived earlier if priorities equal)

          const startTimes: Record<string, number> = {};
          events.forEach((e: GanttEvent) => {
            if (e.pid !== 'IDLE' && e.pid !== 'CS') {
              if (startTimes[e.pid] === undefined) startTimes[e.pid] = e.start;
            }
          });

          Object.entries(startTimes).forEach(([pid, start]) => {
            const p = processes.find((proc) => proc.pid === pid)!;
            processes.forEach((other) => {
              if (other.pid !== pid && other.arrival <= start) {
                const otherStart = startTimes[other.pid];
                if (otherStart > start) {
                  // 'other' was ready but 'p' was picked.
                  const pPrio = p.priority ?? 100;
                  const oPrio = other.priority ?? 100;
                  expect(pPrio).toBeLessThanOrEqual(oPrio);
                }
              }
            });
          });
        }
      )
    );
  });
});
