import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { runMLFQ } from '../../src/engine/mlfq';

describe('MLFQ Property Tests', () => {
  it('should maintain basic invariants', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            pid: fc.uuid(),
            arrival: fc.integer({ min: 0, max: 100 }),
            burst: fc.integer({ min: 1, max: 50 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (processesInput) => {
          const processes = processesInput.map((p, i) => ({ ...p, pid: `P${i}` }));
          const result = runMLFQ(processes);
          const { events, metrics } = result;

          // 1. All processes complete
          expect(Object.keys(metrics.completion).length).toBe(processes.length);

          // 2. No overlapping events
          const sortedEvents = [...events]
            .filter((e) => e.pid !== 'IDLE' && e.pid !== 'CS')
            .sort((a, b) => a.start - b.start);

          for (let i = 0; i < sortedEvents.length - 1; i++) {
            expect(sortedEvents[i].end).toBeLessThanOrEqual(sortedEvents[i + 1].start);
          }

          // 3. CPU utilization is between 0 and 100
          expect(metrics.cpuUtilization).toBeGreaterThanOrEqual(0);
          expect(metrics.cpuUtilization).toBeLessThanOrEqual(100);
        }
      )
    );
  });
});
