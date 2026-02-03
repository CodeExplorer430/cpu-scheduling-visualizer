import { describe, it, expect } from 'vitest';
import { findOptimalQuantum } from '../../lib/optimizer';
import { Process } from '@cpu-vis/shared';

describe('Quantum Optimizer (findOptimalQuantum)', () => {
  const processes: Process[] = [
    { pid: 'P1', arrival: 0, burst: 10 },
    { pid: 'P2', arrival: 0, burst: 2 },
  ];

  it('should find a quantum that balances wait time and context switches', () => {
    // For these processes:
    // Q=1: P1(1), P2(1), P1(1), P2(1), P1(8) -> Many switches
    // Q=2: P1(2), P2(2), P1(8) -> Fewer switches
    // Q=10+: Becomes FCFS

    const result = findOptimalQuantum(processes, { weightSwitch: 1 });

    expect(result.optimalQuantum).toBeGreaterThan(0);
    expect(result.metrics.contextSwitches).toBeLessThan(10); // Should not pick Q=1
    expect(result.minCost).toBeDefined();
  });

  it('should respect the maxQuantumToCheck option', () => {
    const result = findOptimalQuantum(processes, { maxQuantumToCheck: 5 });
    expect(result.optimalQuantum).toBeLessThanOrEqual(5);
  });

  it('should handle an empty process list gracefully', () => {
    const result = findOptimalQuantum([]);
    expect(result.optimalQuantum).toBe(1);
    expect(result.metrics.avgWaiting).toBe(0);
  });
});
