import { describe, it, expect } from 'vitest';
import { runFCFS } from '../../src/engine/fcfs.js';
import { Process } from '../../src/types.js';

describe('FCFS Algorithm', () => {
  it('should schedule processes in order of arrival', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 5 },
      { pid: 'P2', arrival: 2, burst: 3 },
      { pid: 'P3', arrival: 4, burst: 1 },
    ];

    const result = runFCFS(processes);
    const { events, metrics } = result;

    // Expected Gantt:
    // P1: 0-5
    // P2: 5-8 (Arrived at 2, waits for P1)
    // P3: 8-9 (Arrived at 4, waits for P1, P2)

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ pid: 'P1', start: 0, end: 5 });
    expect(events[1]).toEqual({ pid: 'P2', start: 5, end: 8 });
    expect(events[2]).toEqual({ pid: 'P3', start: 8, end: 9 });

    expect(metrics.completion['P1']).toBe(5);
    expect(metrics.completion['P2']).toBe(8);
    expect(metrics.completion['P3']).toBe(9);

    // Turnaround = Completion - Arrival
    // P1: 5-0 = 5
    // P2: 8-2 = 6
    // P3: 9-4 = 5
    expect(metrics.turnaround['P1']).toBe(5);
    expect(metrics.turnaround['P2']).toBe(6);
    expect(metrics.turnaround['P3']).toBe(5);

    // Waiting = Turnaround - Burst
    // P1: 5-5 = 0
    // P2: 6-3 = 3
    // P3: 5-1 = 4
    expect(metrics.waiting['P1']).toBe(0);
    expect(metrics.waiting['P2']).toBe(3);
    expect(metrics.waiting['P3']).toBe(4);
  });

  it('should handle idle time when no process is ready', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 2 },
      { pid: 'P2', arrival: 4, burst: 2 }, // Gap between 2 and 4
    ];

    const result = runFCFS(processes);
    const { events } = result;

    // Expected:
    // P1: 0-2
    // IDLE: 2-4
    // P2: 4-6

    expect(events).toHaveLength(3);
    expect(events[0]).toEqual({ pid: 'P1', start: 0, end: 2 });
    expect(events[1]).toEqual({ pid: 'IDLE', start: 2, end: 4 });
    expect(events[2]).toEqual({ pid: 'P2', start: 4, end: 6 });
  });

  it('should handle identical arrival times (stable sort/order preservation)', () => {
    // Note: FCFS implementation usually sorts by arrival.
    // If stable, it preserves original order.
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 2 },
      { pid: 'P2', arrival: 0, burst: 2 },
    ];

    const result = runFCFS(processes);
    const { events } = result;

    expect(events[0].pid).toBe('P1');
    expect(events[1].pid).toBe('P2');
  });
});
