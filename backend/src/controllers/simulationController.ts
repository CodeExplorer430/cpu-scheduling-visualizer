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

export const runSimulation = (req: Request, res: Response) => {
  const { algorithm, processes, timeQuantum } = req.body;

  // Validate input
  const validation = validateProcesses(processes);
  if (!validation.valid) {
    return res.status(400).json({ error: validation.error });
  }

  const algo = algorithm as Algorithm;
  const quantum = typeof timeQuantum === 'number' ? timeQuantum : 2; // Default quantum
  const options = { quantum };

  try {
    let result;
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
    return res.json(result);
  } catch (error) {
    console.error('Simulation error:', error);
    // Explicitly casting error to check message/stack if needed, but for now generic 500
    return res.status(500).json({ error: 'Internal simulation error' });
  }
};

export const runBatchSimulation = (req: Request, res: Response) => {
  const { algorithms, processes, timeQuantum } = req.body;

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

  algorithms.forEach((algoName: string) => {
    try {
      const algo = algoName as Algorithm;
      switch (algo) {
        case 'FCFS':
          results[algo] = runFCFS(processes as Process[], options);
          break;
        case 'SJF':
          results[algo] = runSJF(processes as Process[], options);
          break;
        case 'LJF':
          results[algo] = runLJF(processes as Process[], options);
          break;
        case 'SRTF':
          results[algo] = runSRTF(processes as Process[], options);
          break;
        case 'LRTF':
          results[algo] = runLRTF(processes as Process[], options);
          break;
        case 'RR':
          results[algo] = runRR(processes as Process[], options);
          break;
        case 'PRIORITY':
          results[algo] = runPriority(processes as Process[], options);
          break;
        case 'PRIORITY_PE':
          results[algo] = runPriorityPreemptive(processes as Process[], options);
          break;
        case 'MQ':
          results[algo] = runMQ(processes as Process[], options);
          break;
        case 'MLFQ':
          results[algo] = runMLFQ(processes as Process[], options);
          break;
        case 'HRRN':
          results[algo] = runHRRN(processes as Process[], options);
          break;
        default:
          results[algoName] = { error: `Algorithm '${algoName}' not supported` };
      }
    } catch (error) {
      console.error(`Batch simulation error for ${algoName}:`, error);
      const message = error instanceof Error ? error.message : 'Internal error';
      results[algoName] = { error: message };
    }
  });

  return res.json(results);
};
