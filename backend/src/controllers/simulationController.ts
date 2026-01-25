import { Request, Response } from 'express';
import {
  runFCFS,
  runSJF,
  runSRTF,
  runRR,
  runPriority,
  validateProcesses,
  Process,
  Algorithm,
} from '@cpu-vis/shared';

export const runSimulation = (req: Request, res: Response) => {
  const { algorithm, processes, timeQuantum } = req.body;

  // Validate input
  const validation = validateProcesses(processes);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const algo = algorithm as Algorithm;
  const quantum = typeof timeQuantum === 'number' ? timeQuantum : 2; // Default quantum

  try {
    let result;
    switch (algo) {
      case 'FCFS':
        result = runFCFS(processes as Process[]);
        break;
      case 'SJF':
        result = runSJF(processes as Process[]);
        break;
      case 'SRTF':
        result = runSRTF(processes as Process[]);
        break;
      case 'RR':
        result = runRR(processes as Process[], quantum);
        break;
      case 'PRIORITY':
        result = runPriority(processes as Process[]);
        break;
      default:
        // Default to FCFS if unknown, or return error
        if (!algo) {
          result = runFCFS(processes as Process[]);
        } else {
          return res.status(400).json({ error: `Algorithm '${algo}' not supported` });
        }
    }
    return res.json(result);
  } catch (error) {
    console.error('Simulation error:', error);
    // Explicitly casting error to check message/stack if needed, but for now generic 500
    return res.status(500).json({ error: 'Internal simulation error' });
  }
};

export const runBatchSimulation = (req: Request, res: Response) => {
  const { algorithms, processes, timeQuantum } = req.body;

  if (!Array.isArray(algorithms) || algorithms.length === 0) {
    return res.status(400).json({ error: 'Algorithms array is required' });
  }

  // Validate input
  const validation = validateProcesses(processes);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const quantum = typeof timeQuantum === 'number' ? timeQuantum : 2;
  const results: Record<string, any> = {};

  algorithms.forEach((algoName: string) => {
    try {
      const algo = algoName as Algorithm;
      switch (algo) {
        case 'FCFS':
          results[algo] = runFCFS(processes as Process[]);
          break;
        case 'SJF':
          results[algo] = runSJF(processes as Process[]);
          break;
        case 'SRTF':
          results[algo] = runSRTF(processes as Process[]);
          break;
        case 'RR':
          results[algo] = runRR(processes as Process[], quantum);
          break;
        case 'PRIORITY':
          results[algo] = runPriority(processes as Process[]);
          break;
        default:
          results[algoName] = { error: `Algorithm '${algoName}' not supported` };
      }
    } catch (error: any) {
      console.error(`Batch simulation error for ${algoName}:`, error);
      results[algoName] = { error: error.message || 'Internal error' };
    }
  });

  return res.json(results);
};
