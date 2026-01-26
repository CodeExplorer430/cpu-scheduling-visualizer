import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { runFCFS } from '../../src/engine/fcfs';

describe('FCFS Multi-core Property Tests', () => {
  it('should maintain invariants across multiple cores', () => {
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
        fc.integer({ min: 1, max: 4 }), // Core count
        (processesInput, coreCount) => {
          const processes = processesInput.map((p, i) => ({ ...p, pid: `${p.pid}-${i}` }));
          const result = runFCFS(processes, { coreCount });
          const { events, metrics } = result;

          // 1. All complete
          expect(Object.keys(metrics.completion).length).toBe(processes.length);

          // 2. No process runs on two cores simultaneously (Non-preemptive FCFS specific)
          // Since it's non-preemptive, each PID should have exactly ONE non-IDLE/non-CS event
          processes.forEach((p) => {
            const pEvents = events.filter((e) => e.pid === p.pid);
            expect(pEvents).toHaveLength(1);
          });

          // 3. No overlap on any single core
          for (let c = 0; c < coreCount; c++) {
            const coreEvents = events
              .filter((e) => e.coreId === c)
              .sort((a, b) => a.start - b.start);

            for (let i = 0; i < coreEvents.length - 1; i++) {
              expect(coreEvents[i].end).toBeLessThanOrEqual(coreEvents[i + 1].start);
            }
          }

          // 4. Total burst time matches
          const totalBurstObserved = events
            .filter((e) => e.pid !== 'IDLE' && e.pid !== 'CS')
            .reduce((sum, e) => sum + (e.end - e.start), 0);
          const totalBurstInput = processes.reduce((sum, p) => sum + p.burst, 0);
          expect(totalBurstObserved).toBe(totalBurstInput);
        }
      )
    );
  });
});
