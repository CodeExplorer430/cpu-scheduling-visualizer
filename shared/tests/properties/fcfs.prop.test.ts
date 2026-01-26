import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { runFCFS } from '../../src/engine/fcfs';
import { Process } from '../../src/types';

describe('FCFS Property Tests', () => {
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
          // Ensure unique PIDs
          const processes = processesInput.map((p, i) => ({ ...p, pid: `${p.pid}-${i}` }));

          const result = runFCFS(processes);
          const { events, metrics } = result;

          // Invariant 1: All processes must complete
          expect(Object.keys(metrics.completion).length).toBe(processes.length);

          // Invariant 2: Completion Time > Arrival
          processes.forEach((p) => {
            const completion = metrics.completion[p.pid];
            expect(completion).toBeGreaterThanOrEqual(p.arrival + p.burst);
          });

          // Invariant 3: No overlap on single core
          // Sort events by start time
          const sortedEvents = events
            .filter((e) => e.pid !== 'IDLE' && e.pid !== 'CS')
            .sort((a, b) => a.start - b.start);

          for (let i = 0; i < sortedEvents.length - 1; i++) {
            expect(sortedEvents[i].end).toBeLessThanOrEqual(sortedEvents[i + 1].start);
          }

          // Invariant 4: FCFS Order (Monotonic start times relative to arrival)
          // Note: If multiple processes arrive at same time, order is stable sort (implementation dependent)
          // But generally, if A arrives strictly before B, A starts before B?
          // Not necessarily if A arrives while C is running, and B arrives while C is running?
          // Queue: [A, B]. Yes.
          // Exception: If A arrives, queue empty, runs. B arrives.
          // If C running, A arrives (queue: [A]). B arrives (queue: [A, B]).
          // Yes, strictly monotonic start times for strictly monotonic arrivals.

          const sortedByArrival = [...processes].sort((a, b) => a.arrival - b.arrival);

          // Map PID to Start Time
          const startTimes: Record<string, number> = {};
          events.forEach((e) => {
            if (e.pid !== 'IDLE' && e.pid !== 'CS') {
              // Only take first start time (though FCFS is non-preemptive so only one)
              if (startTimes[e.pid] === undefined) startTimes[e.pid] = e.start;
            }
          });

          for (let i = 0; i < sortedByArrival.length - 1; i++) {
            const p1 = sortedByArrival[i];
            const p2 = sortedByArrival[i + 1];
            if (p1.arrival < p2.arrival) {
              expect(startTimes[p1.pid]).toBeLessThanOrEqual(startTimes[p2.pid]);
            }
          }
        }
      )
    );
  });
});
