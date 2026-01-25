import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { runSRTF } from '../../src/engine/srtf';

describe('SRTF Property Tests', () => {
  it('should maintain basic invariants and optimality', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            pid: fc.uuid(),
            arrival: fc.integer({ min: 0, max: 50 }),
            burst: fc.integer({ min: 1, max: 20 }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (processesInput) => {
          const processes = processesInput.map((p, i) => ({ ...p, pid: `${p.pid}-${i}` }));
          const result = runSRTF(processes);
          const { events, metrics } = result;

          expect(Object.keys(metrics.completion).length).toBe(processes.length);

          // SRTF Invariant: At any time t, the running process must have the 
          // minimum remaining time among all arrived and unfinished processes.
          
          // Reconstruct state at each time unit
          const maxTime = Math.max(...Object.values(metrics.completion));
          const remainingTime: Record<string, number> = {};
          processes.forEach(p => remainingTime[p.pid] = p.burst);

          for (let t = 0; t < maxTime; t++) {
             const runningEvent = events.find(e => t >= e.start && t < e.end);
             const runningPid = runningEvent?.pid;

             const readyPids = processes
                .filter(p => p.arrival <= t && remainingTime[p.pid] > 0)
                .map(p => p.pid);

             if (readyPids.length > 0) {
                expect(runningPid).toBeDefined();
                expect(runningPid).not.toBe('IDLE');
                
                if (runningPid !== 'CS' && runningPid !== 'IDLE' && runningPid !== undefined) {
                   const runningRem = remainingTime[runningPid];
                   readyPids.forEach(pid => {
                      expect(runningRem).toBeLessThanOrEqual(remainingTime[pid]);
                   });
                   remainingTime[runningPid]--;
                }
             } else {
                expect(runningPid === 'IDLE' || runningPid === undefined).toBe(true);
             }
          }
        }
      )
    );
  });
});
