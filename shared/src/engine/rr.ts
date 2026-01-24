import { GanttEvent, Metrics, Process, SimulationResult } from '../types.js';
import { generateSnapshots } from './utils.js';

interface ProcessWithRemaining extends Process {
  remaining: number;
}

export function runRR(inputProcesses: Process[], quantum: number = 2): SimulationResult {
  // 1. Setup
  // We need a queue of indices or PIDs to manage order efficiently
  // We also need to track remaining time
  const processes: ProcessWithRemaining[] = inputProcesses.map((p) => ({
    ...p,
    remaining: p.burst,
  }));

  // Sort by arrival initially just to manage the "arrival" timeline
  // But the Ready Queue will manage execution order
  const sortedByArrival = [...processes].sort((a, b) => a.arrival - b.arrival);

  let currentTime = 0;
  let completedCount = 0;
  const totalProcesses = processes.length;
  const events: GanttEvent[] = [];

  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};

  const readyQueue: ProcessWithRemaining[] = [];
  let arrivalIndex = 0;

  // Helper to enqueue newly arrived processes
  const enqueueArrivals = (time: number) => {
    while (arrivalIndex < totalProcesses && sortedByArrival[arrivalIndex].arrival <= time) {
      readyQueue.push(sortedByArrival[arrivalIndex]);
      arrivalIndex++;
    }
  };

  // Initial load
  enqueueArrivals(currentTime);

  while (completedCount < totalProcesses) {
    // If queue is empty, jump to next arrival
    if (readyQueue.length === 0) {
      if (arrivalIndex < totalProcesses) {
        const nextArrival = sortedByArrival[arrivalIndex].arrival;

        events.push({ pid: 'IDLE', start: currentTime, end: nextArrival });
        currentTime = nextArrival;
        enqueueArrivals(currentTime);
      }
      continue;
    }

    const currentProcess = readyQueue.shift()!;

    // Determine execution time
    const executeTime = Math.min(currentProcess.remaining, quantum);

    // Record Event
    // Check for merge possibility
    const lastEvent = events[events.length - 1];
    if (lastEvent && lastEvent.pid === currentProcess.pid) {
      lastEvent.end += executeTime;
    } else {
      events.push({
        pid: currentProcess.pid,
        start: currentTime,
        end: currentTime + executeTime,
      });
    }

    // Update state
    currentTime += executeTime;
    currentProcess.remaining -= executeTime;

    // CRITICAL: Check for new arrivals *before* re-queueing current process
    // This gives preference to newly arrived processes over the one that just exhausted its quantum
    enqueueArrivals(currentTime);

    if (currentProcess.remaining > 0) {
      readyQueue.push(currentProcess);
    } else {
      // Process Completed
      completedCount++;
      const completion = currentTime;
      completionTimes[currentProcess.pid] = completion;
      turnaroundTimes[currentProcess.pid] = completion - currentProcess.arrival;
      waitingTimes[currentProcess.pid] = turnaroundTimes[currentProcess.pid] - currentProcess.burst;
    }
  }

  // Aggregate Metrics
  const totalTurnaround = Object.values(turnaroundTimes).reduce((sum, val) => sum + val, 0);
  const totalWaiting = Object.values(waitingTimes).reduce((sum, val) => sum + val, 0);

  // Context Switches
  let contextSwitches = 0;
  for (let i = 0; i < events.length - 1; i++) {
    if (
      events[i].pid !== events[i + 1].pid &&
      events[i].pid !== 'IDLE' &&
      events[i + 1].pid !== 'IDLE'
    ) {
      contextSwitches++;
    }
  }

  const metrics: Metrics = {
    completion: completionTimes,
    turnaround: turnaroundTimes,
    waiting: waitingTimes,
    avgTurnaround: totalProcesses > 0 ? totalTurnaround / totalProcesses : 0,
    avgWaiting: totalProcesses > 0 ? totalWaiting / totalProcesses : 0,
    contextSwitches,
  };

  return {
    events,
    metrics,
    snapshots: generateSnapshots(events, inputProcesses),
  };
}
