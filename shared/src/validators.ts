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

    if (
      process.tickets !== undefined &&
      (typeof process.tickets !== 'number' || process.tickets <= 0)
    ) {
      return { valid: false, error: `Invalid tickets for ${process.pid}. Must be > 0` };
    }

    if (
      process.shareWeight !== undefined &&
      (typeof process.shareWeight !== 'number' || process.shareWeight <= 0)
    ) {
      return { valid: false, error: `Invalid shareWeight for ${process.pid}. Must be > 0` };
    }

    if (process.shareGroup !== undefined && typeof process.shareGroup !== 'string') {
      return { valid: false, error: `Invalid shareGroup for ${process.pid}. Must be a string` };
    }

    if (process.deadline !== undefined) {
      if (typeof process.deadline !== 'number') {
        return { valid: false, error: `Invalid deadline for ${process.pid}` };
      }
      if (process.deadline < process.arrival) {
        return { valid: false, error: `Deadline must be >= arrival for ${process.pid}` };
      }
    }

    if (
      process.period !== undefined &&
      (typeof process.period !== 'number' || process.period <= 0)
    ) {
      return { valid: false, error: `Invalid period for ${process.pid}. Must be > 0` };
    }
  }

  return { valid: true };
}
