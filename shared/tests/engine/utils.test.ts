import { describe, it, expect } from 'vitest';
import { generateSnapshots } from '../../src/engine/utils.js';
import { GanttEvent, Process } from '../../src/types.js';

describe('Engine Utilities', () => {
  describe('generateSnapshots', () => {
    it('should generate correct snapshots for a simple execution', () => {
      const processes: Process[] = [
        { pid: 'P1', arrival: 0, burst: 2 },
        { pid: 'P2', arrival: 1, burst: 2 },
      ];

      const events: GanttEvent[] = [
        { pid: 'P1', start: 0, end: 2 },
        { pid: 'P2', start: 2, end: 4 },
      ];

      const snapshots = generateSnapshots(events, processes);

      // t=0: P1 running, P2 not arrived
      expect(snapshots[0]).toEqual({
        time: 0,
        runningPid: ['P1'],
        readyQueue: [],
      });

      // t=1: P1 running, P2 arrived and ready
      expect(snapshots[1]).toEqual({
        time: 1,
        runningPid: ['P1'],
        readyQueue: ['P2'],
      });

      // t=2: P2 running, P1 finished
      expect(snapshots[2]).toEqual({
        time: 2,
        runningPid: ['P2'],
        readyQueue: [],
      });

      // t=4: All finished
      expect(snapshots[4]).toEqual({
        time: 4,
        runningPid: ['IDLE'],
        readyQueue: [],
      });
    });

    it('should handle idle time snapshots', () => {
      const processes: Process[] = [{ pid: 'P1', arrival: 2, burst: 1 }];
      const events: GanttEvent[] = [
        { pid: 'IDLE', start: 0, end: 2, coreId: 0 },
        { pid: 'P1', start: 2, end: 3, coreId: 0 },
      ];

      const snapshots = generateSnapshots(events, processes);

      expect(snapshots[0].runningPid).toEqual(['IDLE']);
      expect(snapshots[1].runningPid).toEqual(['IDLE']);
      expect(snapshots[2].runningPid).toEqual(['P1']);
    });

    it('should return empty for empty events', () => {
      expect(generateSnapshots([], [])).toEqual([]);
    });
  });
});
