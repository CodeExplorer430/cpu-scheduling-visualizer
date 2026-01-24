import { GanttEvent, Metrics, Process, SimulationResult, SimulationOptions } from '../types.js';
import { generateSnapshots } from './utils.js';

export function runSRTF(inputProcesses: Process[], options: SimulationOptions = {}): SimulationResult {
  const { contextSwitchOverhead = 0, enableLogging = false } = options;
  const logs: string[] = [];
  const log = (msg: string) => { if (enableLogging) logs.push(msg); };

  // 1. Setup working copy with 'remaining' burst time
  const processes = inputProcesses.map(p => ({
    ...p,
    remaining: p.burst
  }));

  let currentTime = 0;
  let completedCount = 0;
  const totalProcesses = processes.length;
  const events: GanttEvent[] = [];
  
  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};

  let lastPid: string | 'IDLE' | 'CS' = 'IDLE';

  // Helper to get ready processes
  const getReadyProcesses = (time: number) => 
    processes.filter(p => p.arrival <= time && p.remaining > 0);

  while (completedCount < totalProcesses) {
    const readyQueue = getReadyProcesses(currentTime);

    // If nothing is ready, jump to the next arrival
    if (readyQueue.length === 0) {
      const pending = processes.filter(p => p.remaining > 0);
      if (pending.length === 0) break; 

      const nextArrival = Math.min(...pending.map(p => p.arrival));
      log(`Time ${currentTime}: System IDLE until ${nextArrival}`);
      
      events.push({
        pid: 'IDLE',
        start: currentTime,
        end: nextArrival
      });
      currentTime = nextArrival;
      lastPid = 'IDLE';
      continue;
    }

    // Select process with shortest remaining time
    // Tie-breaker: Arrival time (FCFS for ties)
    readyQueue.sort((a, b) => {
      if (a.remaining !== b.remaining) return a.remaining - b.remaining;
      return a.arrival - b.arrival;
    });

    const currentProcess = readyQueue[0];

    // Context Switch Overhead
    if (contextSwitchOverhead > 0 && lastPid !== 'IDLE' && lastPid !== currentProcess.pid && lastPid !== 'CS') {
        log(`Time ${currentTime}: Context Switch from ${lastPid} to ${currentProcess.pid}`);
        events.push({
            pid: 'CS',
            start: currentTime,
            end: currentTime + contextSwitchOverhead
        });
        currentTime += contextSwitchOverhead;
        // Re-evaluate ready queue after overhead? 
        // In preemptive, a new process might arrive DURING the switch.
        // Standard SRTF usually decides at t, if switch occurs, it takes delta t.
        // The process starts AFTER overhead.
        // Let's continue with the *selected* process, assuming switch is atomic-ish.
    }

    // Determine how long to run
    const futureArrivals = processes
      .filter(p => p.arrival > currentTime && p.remaining > 0)
      .map(p => p.arrival);
    
    const nextInterruption = futureArrivals.length > 0 
      ? Math.min(...futureArrivals) 
      : Infinity;

    const timeToNextArrival = nextInterruption - currentTime;
    const runTime = Math.min(currentProcess.remaining, timeToNextArrival);

    log(`Time ${currentTime}: ${currentProcess.pid} runs for ${runTime}ms (Rem: ${currentProcess.remaining})`);

    // Create Event
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

    currentProcess.remaining -= runTime;
    currentTime += runTime;
    lastPid = currentProcess.pid;

    if (currentProcess.remaining === 0) {
      log(`Time ${currentTime}: ${currentProcess.pid} completed`);
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

  let contextSwitches = 0;
  if (contextSwitchOverhead > 0) {
      contextSwitches = events.filter(e => e.pid === 'CS').length;
  } else {
      for (let i = 0; i < events.length - 1; i++) {
        if (events[i].pid !== events[i+1].pid && events[i].pid !== 'IDLE' && events[i+1].pid !== 'IDLE') {
          contextSwitches++;
        }
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
    snapshots: generateSnapshots(events, inputProcesses),
    logs: enableLogging ? logs : undefined
  };
}
