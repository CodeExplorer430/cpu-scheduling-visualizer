import { describe, it, expect } from 'vitest';
import { generateRandomProcesses, exportToCSV, parseCSV } from '../src/data.js';
import { Process } from '../src/types.js';

describe('Data Utilities', () => {
  describe('generateRandomProcesses', () => {
    it('should generate correct number of processes', () => {
      const processes = generateRandomProcesses({
        count: 5,
        arrivalRange: [0, 10],
        burstRange: [1, 5],
      });
      expect(processes).toHaveLength(5);
    });

    it('should respect ranges', () => {
      const processes = generateRandomProcesses({
        count: 100,
        arrivalRange: [5, 10],
        burstRange: [10, 20],
      });

      processes.forEach((p: Process) => {
        expect(p.arrival).toBeGreaterThanOrEqual(5);
        expect(p.arrival).toBeLessThanOrEqual(10);
        expect(p.burst).toBeGreaterThanOrEqual(10);
        expect(p.burst).toBeLessThanOrEqual(20);
      });
    });
  });

  describe('CSV Import/Export', () => {
    const processes: Process[] = [
      { pid: 'P1', arrival: 0, burst: 5, priority: 1 },
      { pid: 'P2', arrival: 2, burst: 3 }, // no priority
    ];

    it('should export to CSV correctly', () => {
      const csv = exportToCSV(processes);
      const lines = csv.split('\n');
      expect(lines[0]).toBe(
        'PID,Arrival,Burst,Priority,Tickets,ShareGroup,ShareWeight,Deadline,Period'
      );
      expect(lines[1]).toContain('P1,0,5,1,,,,,');
      expect(lines[2]).toContain('P2,2,3,,,,,,');
    });

    it('should parse CSV correctly', () => {
      const csv = `PID,Arrival,Burst,Priority
P1,0,5,1
P2,2,3,`;

      const parsed = parseCSV(csv);
      expect(parsed).toHaveLength(2);
      expect(parsed[0]).toMatchObject({ pid: 'P1', arrival: 0, burst: 5, priority: 1 });
      expect(parsed[1]).toMatchObject({ pid: 'P2', arrival: 2, burst: 3 });
      expect(parsed[1].priority).toBeUndefined();
      expect(parsed[1].tickets).toBeUndefined();
      expect(parsed[1].shareGroup).toBeUndefined();
      expect(parsed[1].shareWeight).toBeUndefined();
      expect(parsed[1].deadline).toBeUndefined();
      expect(parsed[1].period).toBeUndefined();
    });
  });
});
