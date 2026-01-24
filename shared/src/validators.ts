import { Process } from './types.js';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateProcesses(processes: unknown): ValidationResult {
  if (!Array.isArray(processes)) {
    return { valid: false, error: 'Input must be an array of processes' };
  }

  if (processes.length === 0) {
    return { valid: true }; // Empty is valid but trivial
  }

  const pids = new Set<string>();

  for (const p of processes) {
    // Type guard check
    if (typeof p !== 'object' || p === null) {
      return { valid: false, error: 'Process must be an object' };
    }

    const process = p as Partial<Process>;

    if (!process.pid || typeof process.pid !== 'string') {
      return { valid: false, error: 'Process missing valid PID' };
    }

    if (pids.has(process.pid)) {
      return { valid: false, error: `Duplicate PID found: ${process.pid}` };
    }
    pids.add(process.pid);

    if (typeof process.arrival !== 'number' || process.arrival < 0) {
      return { valid: false, error: `Invalid arrival time for ${process.pid}` };
    }

    if (typeof process.burst !== 'number' || process.burst <= 0) {
      return { valid: false, error: `Invalid burst time for ${process.pid}. Must be > 0` };
    }
  }

  return { valid: true };
}
