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
  result: SimulationResult
) => {
  if (!userId || !result || 'error' in result) return;
  try {
    await SimulationHistory.create({
      userId,
      algorithm,
      processesCount: result.processes.length,
      metrics: {
        avgWaitTime: result.stats.averageWaitTime,
        avgTurnaroundTime: result.stats.averageTurnaroundTime,
        cpuUtilization: result.stats.cpuUtilization,
      },
    });
  } catch (error) {
    console.error('Failed to record simulation history:', error);
  }
};

export const runSimulation = async (req: AuthRequest, res: Response) => {
  const { algorithm, processes, timeQuantum } = req.body;
  const userId = req.auth?.userId;

  // Validate input
  const validation = validateProcesses(processes);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const algo = algorithm as Algorithm;
  const quantum = typeof timeQuantum === 'number' ? timeQuantum : 2; // Default quantum
  const options = { quantum };

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
      default:
        // Default to FCFS if unknown, or return error
        if (!algo) {
          result = runFCFS(processes as Process[], options);
        } else {
          return res.status(400).json({ error: `Algorithm '${algo}' not supported` });
        }
    }

    if (userId) {
      recordHistory(userId, algo || 'FCFS', result);
    }

    return res.json(result);
  } catch (error) {
    console.error('Simulation error:', error);
    // Explicitly casting error to check message/stack if needed, but for now generic 500
    return res.status(500).json({ error: 'Internal simulation error' });
  }
};

export const runBatchSimulation = async (req: AuthRequest, res: Response) => {
  const { algorithms, processes, timeQuantum } = req.body;
  const userId = req.auth?.userId;

  console.log(`[BatchSim] Request received for algorithms: ${algorithms?.join(', ')}`);

  if (!Array.isArray(algorithms) || algorithms.length === 0) {
    return res.status(400).json({ error: 'Algorithms array is required' });
  }

  // Validate input
  const validation = validateProcesses(processes);
  if (!validation.valid) {
    console.warn(`[BatchSim] Validation failed: ${validation.error}`);
    return res.status(400).json({ error: validation.error });
  }

  const quantum = typeof timeQuantum === 'number' ? timeQuantum : 2;
  const options = { quantum };
  const results: Record<string, SimulationResult | { error: string }> = {};

  console.log(
    `[BatchSim] Starting simulation for ${algorithms.length} algorithms. Process count: ${processes?.length}`
  );

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
        default:
          results[algoName] = { error: `Algorithm '${algoName}' not supported` };
          continue;
      }
      results[algoName] = result;
      if (userId) {
        recordHistory(userId, algo, result);
      }
    } catch (error) {
      console.error(`Batch simulation error for ${algoName}:`, error);
      const message = error instanceof Error ? error.message : 'Internal error';
      results[algoName] = { error: message };
    }
  }

  return res.json(results);
};
