import { describe, it, expect } from 'vitest';
import { runLottery } from '../../src/engine/lottery.js';
import { Process } from '../../src/types.js';

describe('Lottery Scheduling', () => {
  it('should be deterministic with the same seed', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 4, tickets: 1 },
      { pid: 'P2', arrival: 0, burst: 4, tickets: 3 },
    ];

    const runA = runLottery(processes, { randomSeed: 7 });
    const runB = runLottery(processes, { randomSeed: 7 });

    expect(runA.events).toEqual(runB.events);
  });

  it('should complete all processes and honor arrivals', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 2, tickets: 1 },
      { pid: 'P2', arrival: 3, burst: 1, tickets: 10 },
    ];

    const result = runLottery(processes, { randomSeed: 5 });

    expect(result.metrics.completion.P1).toBeGreaterThan(0);
    expect(result.metrics.completion.P2).toBeGreaterThanOrEqual(3);
    expect(result.events.some((e) => e.pid === 'IDLE')).toBe(true);
  });
});
