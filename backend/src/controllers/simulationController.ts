import { Request, Response } from 'express';
import {
  runFCFS,
  runSJF,
  runLJF,
  runSRTF,
  runLRTF,
  runRR,
  runPriority,
  runPriorityPreemptive,
  runMQ,
  runMLFQ,
  runHRRN,
  runFairShare,
  runLottery,
  runEDF,
  runRMS,
  validateProcesses,
  Process,
  Algorithm,
  SimulationResult,
} from '@cpu-vis/shared';
import { SimulationHistory } from '../models/SimulationHistory.js';
import { TokenPayload } from '../middleware/auth.js';

interface AuthRequest extends Request {
  auth?: TokenPayload;
}

const recordHistory = async (
  userId: string | undefined,
  algorithm: string,
  result: SimulationResult,
  processesCount: number
) => {
  if (!userId || !result) return;
  try {
    await SimulationHistory.create({
      userId,
      algorithm,
      processesCount,
      metrics: {
        avgWaitTime: result.metrics.avgWaiting,
        avgTurnaroundTime: result.metrics.avgTurnaround,
        cpuUtilization: result.metrics.cpuUtilization || 0,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Failed to record simulation history:', error);
    }
  }
};

export const runSimulation = async (req: AuthRequest, res: Response) => {
  const { algorithm, processes, timeQuantum, randomSeed, fairShareQuantum } = req.body;
  const userId = req.auth?.userId;

  // Validate input
  const validation = validateProcesses(processes);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const algo = algorithm as Algorithm;
  const quantum = typeof timeQuantum === 'number' ? timeQuantum : 2; // Default quantum
  const options = { quantum, randomSeed, fairShareQuantum };

  try {
    let result: SimulationResult;
    switch (algo) {
      case 'FCFS':
        result = runFCFS(processes as Process[], options);
        break;
      case 'SJF':
        result = runSJF(processes as Process[], options);
        break;
      case 'LJF':
        result = runLJF(processes as Process[], options);
        break;
      case 'SRTF':
        result = runSRTF(processes as Process[], options);
        break;
      case 'LRTF':
        result = runLRTF(processes as Process[], options);
        break;
      case 'RR':
        result = runRR(processes as Process[], options);
        break;
      case 'PRIORITY':
        result = runPriority(processes as Process[], options);
        break;
      case 'PRIORITY_PE':
        result = runPriorityPreemptive(processes as Process[], options);
        break;
      case 'MQ':
        result = runMQ(processes as Process[], options);
        break;
      case 'MLFQ':
        result = runMLFQ(processes as Process[], options);
        break;
      case 'HRRN':
        result = runHRRN(processes as Process[], options);
        break;
      case 'FAIR_SHARE':
        result = runFairShare(processes as Process[], options);
        break;
      case 'LOTTERY':
        result = runLottery(processes as Process[], options);
        break;
      case 'EDF':
        result = runEDF(processes as Process[], options);
        break;
      case 'RMS':
        result = runRMS(processes as Process[], options);
        break;
      default:
        // Default to FCFS if unknown, or return error
        if (!algo) {
          result = runFCFS(processes as Process[], options);
        } else {
          return res.status(400).json({ error: `Algorithm '${algo}' not supported` });
        }
    }

    if (userId) {
      recordHistory(userId, algo || 'FCFS', result, (processes as Process[]).length);
    }

    return res.json(result);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('Simulation error:', error);
    }
    // Explicitly casting error to check message/stack if needed, but for now generic 500
    return res.status(500).json({ error: 'Internal simulation error' });
  }
};

export const runBatchSimulation = async (req: AuthRequest, res: Response) => {
  const { algorithms, processes, timeQuantum, randomSeed, fairShareQuantum } = req.body;
  const userId = req.auth?.userId;

  if (process.env.NODE_ENV !== 'test') {
    console.log(`[BatchSim] Request received for algorithms: ${algorithms?.join(', ')}`);
  }

  if (!Array.isArray(algorithms) || algorithms.length === 0) {
    return res.status(400).json({ error: 'Algorithms array is required' });
  }

  // Validate input
  const validation = validateProcesses(processes);
  if (!validation.valid) {
    if (process.env.NODE_ENV !== 'test') {
      console.warn(`[BatchSim] Validation failed: ${validation.error}`);
    }
    return res.status(400).json({ error: validation.error });
  }

  const quantum = typeof timeQuantum === 'number' ? timeQuantum : 2;
  const options = { quantum, randomSeed, fairShareQuantum };
  const results: Record<string, SimulationResult | { error: string }> = {};

  const processCount = (processes as Process[]).length;
  if (process.env.NODE_ENV !== 'test') {
    console.log(
      `[BatchSim] Starting simulation for ${algorithms.length} algorithms. Process count: ${processCount}`
    );
  }

  for (const algoName of algorithms) {
    try {
      const algo = algoName as Algorithm;
      let result: SimulationResult;
      switch (algo) {
        case 'FCFS':
          result = runFCFS(processes as Process[], options);
          break;
        case 'SJF':
          result = runSJF(processes as Process[], options);
          break;
        case 'LJF':
          result = runLJF(processes as Process[], options);
          break;
        case 'SRTF':
          result = runSRTF(processes as Process[], options);
          break;
        case 'LRTF':
          result = runLRTF(processes as Process[], options);
          break;
        case 'RR':
          result = runRR(processes as Process[], options);
          break;
        case 'PRIORITY':
          result = runPriority(processes as Process[], options);
          break;
        case 'PRIORITY_PE':
          result = runPriorityPreemptive(processes as Process[], options);
          break;
        case 'MQ':
          result = runMQ(processes as Process[], options);
          break;
        case 'MLFQ':
          result = runMLFQ(processes as Process[], options);
          break;
        case 'HRRN':
          result = runHRRN(processes as Process[], options);
          break;
        case 'FAIR_SHARE':
          result = runFairShare(processes as Process[], options);
          break;
        case 'LOTTERY':
          result = runLottery(processes as Process[], options);
          break;
        case 'EDF':
          result = runEDF(processes as Process[], options);
          break;
        case 'RMS':
          result = runRMS(processes as Process[], options);
          break;
        default:
          results[algoName] = { error: `Algorithm '${algoName}' not supported` };
          continue;
      }
      results[algoName] = result;
      if (userId) {
        recordHistory(userId, algo, result, processCount);
      }
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.error(`Batch simulation error for ${algoName}:`, error);
      }
      const message = error instanceof Error ? error.message : 'Internal error';
      results[algoName] = { error: message };
    }
  }

  return res.json(results);
};
