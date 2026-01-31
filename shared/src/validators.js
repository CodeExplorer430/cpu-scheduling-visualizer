'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.validateProcesses = validateProcesses;
function validateProcesses(processes) {
  if (!Array.isArray(processes)) {
    return { valid: false, error: 'Input must be an array of processes' };
  }
  if (processes.length === 0) {
    return { valid: true }; // Empty is valid but trivial
  }
  var pids = new Set();
  for (var _i = 0, processes_1 = processes; _i < processes_1.length; _i++) {
    var p = processes_1[_i];
    // Type guard check
    if (typeof p !== 'object' || p === null) {
      return { valid: false, error: 'Process must be an object' };
    }
    var process_1 = p;
    if (!process_1.pid || typeof process_1.pid !== 'string') {
      return { valid: false, error: 'Process missing valid PID' };
    }
    if (pids.has(process_1.pid)) {
      return { valid: false, error: 'Duplicate PID found: '.concat(process_1.pid) };
    }
    pids.add(process_1.pid);
    if (typeof process_1.arrival !== 'number' || process_1.arrival < 0) {
      return { valid: false, error: 'Invalid arrival time for '.concat(process_1.pid) };
    }
    if (typeof process_1.burst !== 'number' || process_1.burst <= 0) {
      return {
        valid: false,
        error: 'Invalid burst time for '.concat(process_1.pid, '. Must be > 0'),
      };
    }
  }
  return { valid: true };
}
