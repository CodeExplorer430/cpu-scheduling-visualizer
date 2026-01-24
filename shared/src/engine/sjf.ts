import { GanttEvent, Metrics, Process, SimulationResult } from '../types.js';
import { generateSnapshots } from './utils.js';

export function runSJF(inputProcesses: Process[]): SimulationResult {
  // Deep copy to avoid mutating inputs
  const processes = inputProcesses.map((p) => ({ ...p }));

  // Sort initial list by arrival time to handle the "arriving" logic
  processes.sort((a, b) => a.arrival - b.arrival);

  let currentTime = 0;
  const events: GanttEvent[] = [];

  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};

  let completedCount = 0;
  const totalProcesses = processes.length;

  const readyQueue: Process[] = [];
  let pIndex = 0;

  while (completedCount < totalProcesses) {
    // 1. Enqueue all processes that have arrived by currentTime
    while (pIndex < totalProcesses && processes[pIndex].arrival <= currentTime) {
      readyQueue.push(processes[pIndex]);
      pIndex++;
    }

    // 2. If ready queue is empty, jump to next arrival
    if (readyQueue.length === 0) {
      if (pIndex < totalProcesses) {
        const nextArrival = processes[pIndex].arrival;

        events.push({
          pid: 'IDLE',
          start: currentTime,
          end: nextArrival,
        });
        currentTime = nextArrival;
        continue;
      }
    }

    // 3. Select process with shortest burst time
    readyQueue.sort((a, b) => {
      if (a.burst !== b.burst) return a.burst - b.burst;
      return a.arrival - b.arrival;
    });

    const currentProcess = readyQueue.shift();
    if (currentProcess) {
      const start = currentTime;
      const end = start + currentProcess.burst;

      events.push({
        pid: currentProcess.pid,
        start,
        end,
      });

      currentTime = end;

      // Metrics
      completionTimes[currentProcess.pid] = end;
      turnaroundTimes[currentProcess.pid] = end - currentProcess.arrival;
      waitingTimes[currentProcess.pid] = turnaroundTimes[currentProcess.pid] - currentProcess.burst;

      completedCount++;
    }
  }

  // Aggregate metrics
  const totalTurnaround = Object.values(turnaroundTimes).reduce((sum, val) => sum + val, 0);
  const totalWaiting = Object.values(waitingTimes).reduce((sum, val) => sum + val, 0);

  const metrics: Metrics = {
    completion: completionTimes,

    turnaround: turnaroundTimes,

    waiting: waitingTimes,

    avgTurnaround: totalProcesses > 0 ? totalTurnaround / totalProcesses : 0,

    avgWaiting: totalProcesses > 0 ? totalWaiting / totalProcesses : 0,

    contextSwitches: 0,
  };

  return {
    events,

    metrics,

    snapshots: generateSnapshots(events, inputProcesses),
  };
}
