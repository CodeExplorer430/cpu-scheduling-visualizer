import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { runRR } from '../../src/engine/rr.js';
import { GanttEvent } from '../../src/types.js';

describe('RR Property Tests', () => {
  it('should be fair and eventually complete', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            pid: fc.uuid(),
            arrival: fc.integer({ min: 0, max: 30 }),
            burst: fc.integer({ min: 1, max: 10 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.integer({ min: 1, max: 5 }), // Quantum
        (processesInput, quantum) => {
          const processes = processesInput.map((p, i) => ({ ...p, pid: `${p.pid}-${i}` }));
          const result = runRR(processes, { quantum });

          expect(Object.keys(result.metrics.completion).length).toBe(processes.length);

          // Invariant: No process runs for more than 'quantum' continuously
          result.events.forEach((e: GanttEvent) => {
            if (e.pid !== 'IDLE' && e.pid !== 'CS') {
              expect(e.end - e.start).toBeLessThanOrEqual(quantum);
            }
          });
        }
      )
    );
  });
});
