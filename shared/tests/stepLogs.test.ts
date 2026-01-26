import { describe, it, expect } from 'vitest';
import { runFCFS } from '../src/engine/fcfs.js';
import { Process } from '../src/types.js';

describe('Step Logs (Decision Explanation)', () => {
  it('should generate step logs for FCFS', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 5 },
      { pid: 'P2', arrival: 2, burst: 3 },
    ];

    const result = runFCFS(processes, { enableLogging: true });

    expect(result.stepLogs).toBeDefined();
    expect(result.stepLogs?.length).toBeGreaterThan(0);

    const firstDecision = result.stepLogs![0];
    // expect(firstDecision.pid).toBeDefined(); // PID is embedded in message or implied
    expect(firstDecision.message).toContain('Selected Process P1');
    expect(firstDecision.reason).toContain('arrived earliest');
    expect(firstDecision.time).toBe(0);
  });
});
