import { Process, runRR } from '@cpu-vis/shared';

interface OptimizationResult {
  optimalQuantum: number;
  minCost: number;
  metrics: {
    avgWaiting: number;
    avgTurnaround: number;
    contextSwitches: number;
  };
}

export function findOptimalQuantum(
  processes: Process[],
  options: {
    maxQuantumToCheck?: number;
    weightWait?: number;
    weightSwitch?: number;
  } = {}
): OptimizationResult {
  const {
    maxQuantumToCheck = 50,
    weightWait = 1,
    weightSwitch = 0.5, // High penalty for context switches to encourage efficiency
  } = options;

  let optimalQuantum = 1;
  let minCost = Infinity;
  let bestMetrics = {
    avgWaiting: Infinity,
    avgTurnaround: Infinity,
    contextSwitches: Infinity,
  };

  // Heuristic: Check range [1, limit]
  // We cap at a reasonable number (e.g. 50 or max burst) because very large quantums -> FCFS
  const maxBurst = Math.max(...processes.map((p) => p.burst));
  const limit = Math.min(Math.max(20, maxBurst), maxQuantumToCheck);

  for (let q = 1; q <= limit; q++) {
    const result = runRR(processes, { 
      quantum: q, 
      contextSwitchOverhead: 0 // Assume overhead is internal logic or provided? 
      // Ideally we should pass the actual CS overhead if we want to penalize real time.
      // But here we optimize for "count" penalty.
    });
    
    const cs = result.metrics.contextSwitches ?? 0;
    const aw = result.metrics.avgWaiting;
    
    // Cost Function
    const cost = (weightWait * aw) + (weightSwitch * cs);

    if (cost < minCost) {
      minCost = cost;
      optimalQuantum = q;
      bestMetrics = {
        avgWaiting: aw,
        avgTurnaround: result.metrics.avgTurnaround,
        contextSwitches: cs,
      };
    }
  }

  return { optimalQuantum, minCost, metrics: bestMetrics };
}
