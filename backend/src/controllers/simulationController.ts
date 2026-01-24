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
