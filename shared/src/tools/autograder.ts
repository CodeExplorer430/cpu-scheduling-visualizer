import { Process, Algorithm, SimulationResult, SimulationOptions } from '../types.js';
import { runFCFS } from '../engine/fcfs.js';
import { runSJF } from '../engine/sjf.js';
import { runLJF } from '../engine/ljf.js';
import { runSRTF } from '../engine/srtf.js';
import { runLRTF } from '../engine/lrtf.js';
import { runRR } from '../engine/rr.js';
import { runPriority } from '../engine/priority.js';
import { runPriorityPreemptive } from '../engine/priority_preemptive.js';
import { runHRRN } from '../engine/hrrn.js';
import { runMQ } from '../engine/mq.js';
import { runMLFQ } from '../engine/mlfq.js';

export interface TestCase {
  id: string;
  description: string;
  algorithm: Algorithm;
  processes: Process[];
  options?: SimulationOptions;
  expected?: {
    avgTurnaround?: number;
    avgWaiting?: number;
    totalTime?: number;
    // We can add stricter checks like execution order later
  };
}

export interface TestResult {
  testCaseId: string;
  passed: boolean;
  actualMetrics: {
    avgTurnaround: number;
    avgWaiting: number;
  };
  expectedMetrics?: {
    avgTurnaround?: number;
    avgWaiting?: number;
  };
  diff?: {
    turnaroundDiff: number;
    waitingDiff: number;
  };
  error?: string;
}

export interface AutoGradeReport {
  results: TestResult[];
  score: number; // 0 to 100
  totalTests: number;
  passedTests: number;
}

const engineMap: Record<Algorithm, (p: Process[], o?: SimulationOptions) => SimulationResult> = {
  FCFS: runFCFS,
  SJF: runSJF,
  LJF: runLJF,
  SRTF: runSRTF,
  LRTF: runLRTF,
  RR: runRR,
  PRIORITY: runPriority,
  PRIORITY_PE: runPriorityPreemptive,
  HRRN: runHRRN,
  MQ: runMQ,
  MLFQ: runMLFQ,
};

export const runAutoGrader = (testCases: TestCase[]): AutoGradeReport => {
  const results: TestResult[] = testCases.map((testCase) => {
    try {
      const engine = engineMap[testCase.algorithm];
      if (!engine) {
        return {
          testCaseId: testCase.id,
          passed: false,
          actualMetrics: { avgTurnaround: 0, avgWaiting: 0 },
          error: `Algorithm ${testCase.algorithm} not supported`,
        };
      }

      // Clone processes to avoid mutation issues between runs if not handled by engine
      const processesCopy = JSON.parse(JSON.stringify(testCase.processes));
      const result = engine(processesCopy, testCase.options);

      const actualTAT = result.metrics.avgTurnaround;
      const actualWT = result.metrics.avgWaiting;

      let passed = true;
      const diff = { turnaroundDiff: 0, waitingDiff: 0 };

      if (testCase.expected) {
        if (testCase.expected.avgTurnaround !== undefined) {
          const expectedTAT = testCase.expected.avgTurnaround;
          // Floating point tolerance
          if (Math.abs(actualTAT - expectedTAT) > 0.01) passed = false;
          diff.turnaroundDiff = actualTAT - expectedTAT;
        }
        if (testCase.expected.avgWaiting !== undefined) {
          const expectedWT = testCase.expected.avgWaiting;
          if (Math.abs(actualWT - expectedWT) > 0.01) passed = false;
          diff.waitingDiff = actualWT - expectedWT;
        }
      }

      return {
        testCaseId: testCase.id,
        passed,
        actualMetrics: { avgTurnaround: actualTAT, avgWaiting: actualWT },
        expectedMetrics: testCase.expected,
        diff,
      };
    } catch (e) {
      return {
        testCaseId: testCase.id,
        passed: false,
        actualMetrics: { avgTurnaround: 0, avgWaiting: 0 },
        error: e instanceof Error ? e.message : 'Unknown error',
      };
    }
  });

  const passedTests = results.filter((r) => r.passed).length;
  const score = testCases.length > 0 ? (passedTests / testCases.length) * 100 : 0;

  return {
    results,
    score,
    totalTests: testCases.length,
    passedTests,
  };
};
