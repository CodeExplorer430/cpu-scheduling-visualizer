import { describe, it, expect } from 'vitest';
import { runFairShare } from '../../src/engine/fair_share.js';
import { Process } from '../../src/types.js';

describe('Fair-Share Scheduling', () => {
  it('should distribute service across groups using weights', () => {
    const processes: Process[] = [
      { pid: 'A1', arrival: 0, burst: 4, shareGroup: 'A', shareWeight: 1 },
      { pid: 'B1', arrival: 0, burst: 4, shareGroup: 'B', shareWeight: 2 },
    ];

    const result = runFairShare(processes);
    const events = result.events.filter((e) => e.pid !== 'IDLE');
    const aTime = events.filter((e) => e.pid === 'A1').reduce((s, e) => s + (e.end - e.start), 0);
    const bTime = events.filter((e) => e.pid === 'B1').reduce((s, e) => s + (e.end - e.start), 0);

    expect(aTime).toBe(4);
    expect(bTime).toBe(4);
  });

  it('should default group and weight when missing', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 2 },
      { pid: 'P2', arrival: 0, burst: 2 },
    ];

    const result = runFairShare(processes);
    expect(result.metrics.completion.P1).toBeGreaterThan(0);
    expect(result.metrics.completion.P2).toBeGreaterThan(0);
  });
});
