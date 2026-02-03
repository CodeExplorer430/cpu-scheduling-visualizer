import { describe, it, expect } from 'vitest';
import { runAutoGrader, TestCase } from '../../src/tools/autograder.js';

describe('AutoGrader Tool', () => {
  const processes = [
    { pid: 'P1', arrival: 0, burst: 4 },
    { pid: 'P2', arrival: 0, burst: 2 },
  ];

  it('should pass when metrics match', () => {
    const testCases: TestCase[] = [
      {
        id: 'tc-1',
        description: 'Basic FCFS',
        algorithm: 'FCFS',
        processes,
        expected: {
          avgTurnaround: 5, // P1: 4, P2: 6 -> (4+6)/2 = 5
          avgWaiting: 2, // P1: 0, P2: 4 -> (0+4)/2 = 2
        },
      },
    ];

    const report = runAutoGrader(testCases);
    expect(report.passedTests).toBe(1);
    expect(report.results[0].passed).toBe(true);
  });

  it('should fail when metrics are outside tolerance', () => {
    const testCases: TestCase[] = [
      {
        id: 'tc-2',
        description: 'Wrong expectations',
        algorithm: 'FCFS',
        processes,
        expected: {
          avgWaiting: 10,
        },
      },
    ];

    const report = runAutoGrader(testCases);
    expect(report.passedTests).toBe(0);
    expect(report.results[0].passed).toBe(false);
  });

  it('should validate strict execution sequence (expectedSchedule)', () => {
    const testCases: TestCase[] = [
      {
        id: 'tc-3',
        description: 'RR Sequence Check',
        algorithm: 'RR',
        processes,
        options: { quantum: 2 },
        expected: {
          expectedSchedule: ['P1', 'P2', 'P1'], // RR Q=2: P1(2), P2(2), P1(2)
        },
      },
    ];

    const report = runAutoGrader(testCases);
    expect(report.results[0].passed).toBe(true);
  });

  it('should fail if sequence is incorrect even if metrics pass', () => {
    const testCases: TestCase[] = [
      {
        id: 'tc-4',
        description: 'Wrong Sequence',
        algorithm: 'RR',
        processes,
        options: { quantum: 2 },
        expected: {
          expectedSchedule: ['P2', 'P1', 'P1'], // Wrong order
        },
      },
    ];

    const report = runAutoGrader(testCases);
    expect(report.results[0].passed).toBe(false);
    expect(report.results[0].diff?.scheduleMismatch).toBeDefined();
  });
});
