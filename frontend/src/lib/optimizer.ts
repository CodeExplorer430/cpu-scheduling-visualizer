import { Process, runRR, Metrics } from '@cpu-vis/shared';

export function findOptimalQuantum(processes: Process[], maxQuantumToCheck: number = 20): { optimalQuantum: number; minAvgWaiting: number } {
  let optimalQuantum = 1;
  let minAvgWaiting = Infinity;

  // Heuristic: Check range [1, max_burst] or fixed range
  // Let's check 1 to 20 or max burst
  const maxBurst = Math.max(...processes.map(p => p.burst));
  const limit = Math.min(maxBurst, maxQuantumToCheck);

  for (let q = 1; q <= limit; q++) {
    const result = runRR(processes, { quantum: q });
    if (result.metrics.avgWaiting < minAvgWaiting) {
      minAvgWaiting = result.metrics.avgWaiting;
      optimalQuantum = q;
    }
  }

  return { optimalQuantum, minAvgWaiting };
}
