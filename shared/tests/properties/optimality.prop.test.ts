import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { runSJF } from '../../src/engine/sjf.js';
import { runFCFS } from '../../src/engine/fcfs.js';
import { Process } from '../../src/types.js';

// Helper to get all permutations
function getPermutations<T>(array: T[]): T[][] {
  if (array.length <= 1) return [array];
  const perms: T[][] = [];
  for (let i = 0; i < array.length; i++) {
    const char = array[i];
    const remainingChars = array.slice(0, i).concat(array.slice(i + 1));
    for (const subPerm of getPermutations(remainingChars)) {
      perms.push([char, ...subPerm]);
    }
  }
  return perms;
}

// Simple non-preemptive simulator for a fixed sequence
function runSequence(processes: Process[]): number {
  let time = 0;
  let totalWait = 0;
  processes.forEach((p) => {
    if (time < p.arrival) time = p.arrival;
    const wait = time - p.arrival;
    totalWait += wait;
    time += p.burst;
  });
  return totalWait / processes.length;
}

describe('SJF Optimality Property Tests', () => {
  it('should produce minimum average waiting time for processes arriving at t=0', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            pid: fc.uuid(),
            arrival: fc.constant(0), // All arrive at 0
            burst: fc.integer({ min: 1, max: 20 }),
          }),
          { minLength: 1, maxLength: 6 } // Small N for permutations
        ),
        (processesInput) => {
          const processes = processesInput.map((p, i) => ({ ...p, pid: `P${i}` }));

          // SJF Result
          const sjfResult = runSJF(processes);
          const sjfAvgWait = sjfResult.metrics.avgWaiting;

          // Brute force all permutations
          const allPerms = getPermutations(processes);
          let minAvgWait = Infinity;

          allPerms.forEach((perm) => {
            const wait = runSequence(perm);
            if (wait < minAvgWait) minAvgWait = wait;
          });

          // Floating point precision margin
          expect(sjfAvgWait).toBeLessThanOrEqual(minAvgWait + 0.0001);
        }
      )
    );
  });

  it('should always perform as well or better than FCFS regarding waiting time at t=0', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            pid: fc.uuid(),
            arrival: fc.constant(0),
            burst: fc.integer({ min: 1, max: 50 }),
          }),
          { minLength: 1, maxLength: 20 }
        ),
        (processesInput) => {
          const processes = processesInput.map((p, i) => ({ ...p, pid: `P${i}` }));
          const sjf = runSJF(processes);
          const fcfs = runFCFS(processes);

          expect(sjf.metrics.avgWaiting).toBeLessThanOrEqual(fcfs.metrics.avgWaiting + 0.0001);
        }
      )
    );
  });
});
