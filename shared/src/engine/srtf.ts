import { GanttEvent, Metrics, Process, SimulationResult } from '../types.js';
import { generateSnapshots } from './utils.js';

export function runSRTF(inputProcesses: Process[]): SimulationResult {
  // 1. Setup working copy with 'remaining' burst time
  const processes = inputProcesses.map(p => ({
    ...p,
    remaining: p.burst
  }));

  let currentTime = 0;
  let completedCount = 0;
  const totalProcesses = processes.length;
  const events: GanttEvent[] = [];
  
  // Metrics storage
  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};

  // Helper to get ready processes
  const getReadyProcesses = (time: number) => 
    processes.filter(p => p.arrival <= time && p.remaining > 0);

  // We will loop until all processes are completed
  // To avoid infinite loops in case of errors, we'll add a safety limit or rely on logic correctness
  while (completedCount < totalProcesses) {
    const readyQueue = getReadyProcesses(currentTime);

    // If nothing is ready, jump to the next arrival
    if (readyQueue.length === 0) {
      const pending = processes.filter(p => p.remaining > 0);
      if (pending.length === 0) break; // Should be covered by completedCount check, but safety first

      // Find next arrival time
      const nextArrival = Math.min(...pending.map(p => p.arrival));
      
      events.push({
        pid: 'IDLE',
        start: currentTime,
        end: nextArrival
      });
      currentTime = nextArrival;
      continue;
    }

    // Select process with shortest remaining time
    // Tie-breaker: Arrival time (FCFS for ties)
    readyQueue.sort((a, b) => {
      if (a.remaining !== b.remaining) return a.remaining - b.remaining;
      return a.arrival - b.arrival;
    });

    const currentProcess = readyQueue[0];

    // Determine how long to run:
    // Run until:
    // 1. Process finishes (currentProcess.remaining)
    // 2. A new process arrives that *might* be shorter (next arrival time > currentTime)
    
    // Find next arrival that is strictly in the future
    const futureArrivals = processes
      .filter(p => p.arrival > currentTime && p.remaining > 0)
      .map(p => p.arrival);
    
    const nextInterruption = futureArrivals.length > 0 
      ? Math.min(...futureArrivals) 
      : Infinity;

    const timeToNextArrival = nextInterruption - currentTime;
    
    // We run either until completion or until the next arrival
    const runTime = Math.min(currentProcess.remaining, timeToNextArrival);

    // Create Event
    // Optimization: If the last event was the same PID, merge them
    const lastEvent = events[events.length - 1];
    if (lastEvent && lastEvent.pid === currentProcess.pid) {
      lastEvent.end += runTime;
    } else {
      events.push({
        pid: currentProcess.pid,
        start: currentTime,
        end: currentTime + runTime
      });
    }

    // Update state
    currentProcess.remaining -= runTime;
    currentTime += runTime;

    // Check completion
    if (currentProcess.remaining === 0) {
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

  // Count context switches (transitions from one PID to another, excluding IDLE)
  // We can count this by looking at the raw events list
  let contextSwitches = 0;
  for (let i = 0; i < events.length - 1; i++) {
    if (events[i].pid !== events[i+1].pid && events[i].pid !== 'IDLE' && events[i+1].pid !== 'IDLE') {
      contextSwitches++;
    }
  }

  const metrics: Metrics = {
    completion: completionTimes,
    turnaround: turnaroundTimes,
    waiting: waitingTimes,
    avgTurnaround: totalProcesses > 0 ? totalTurnaround / totalProcesses : 0,
    avgWaiting: totalProcesses > 0 ? totalWaiting / totalProcesses : 0,
    contextSwitches
  };

  return { 
    events, 
    metrics,
    snapshots: generateSnapshots(events, inputProcesses)
  };
}
