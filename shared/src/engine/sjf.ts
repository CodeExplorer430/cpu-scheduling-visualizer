import { GanttEvent, Metrics, Process, SimulationResult, SimulationOptions } from '../types.js';
import { generateSnapshots } from './utils.js';

export function runSJF(inputProcesses: Process[], options: SimulationOptions = {}): SimulationResult {
  const { contextSwitchOverhead = 0, enableLogging = false } = options;
  const logs: string[] = [];
  const log = (msg: string) => { if (enableLogging) logs.push(msg); };

  // Deep copy to avoid mutating inputs
  const processes = inputProcesses.map(p => ({ ...p }));
  
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
  let lastPid: string | 'IDLE' | 'CS' = 'IDLE';

  while (completedCount < totalProcesses) {
    // 1. Enqueue all processes that have arrived by currentTime
    while (pIndex < totalProcesses && processes[pIndex].arrival <= currentTime) {
      log(`Time ${currentTime}: Process ${processes[pIndex].pid} arrived and queued`);
      readyQueue.push(processes[pIndex]);
      pIndex++;
    }

    // 2. If ready queue is empty, jump to next arrival
    if (readyQueue.length === 0) {
      if (pIndex < totalProcesses) {
        const nextArrival = processes[pIndex].arrival;
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
    }

    // 3. Select process with shortest burst time
    readyQueue.sort((a, b) => {
      if (a.burst !== b.burst) return a.burst - b.burst;
      return a.arrival - b.arrival;
    });

    const currentProcess = readyQueue.shift();
    if (currentProcess) {
      // Context Switch Overhead
      if (contextSwitchOverhead > 0 && lastPid !== 'IDLE' && lastPid !== currentProcess.pid && lastPid !== 'CS') {
          log(`Time ${currentTime}: Context Switch from ${lastPid} to ${currentProcess.pid}`);
          events.push({
              pid: 'CS',
              start: currentTime,
              end: currentTime + contextSwitchOverhead
          });
          currentTime += contextSwitchOverhead;
          // Re-check arrivals
          while (pIndex < totalProcesses && processes[pIndex].arrival <= currentTime) {
            readyQueue.push(processes[pIndex]);
            pIndex++;
          }
      }

      const start = currentTime;
      const end = start + currentProcess.burst;
      log(`Time ${currentTime}: ${currentProcess.pid} starts execution (Burst: ${currentProcess.burst})`);

      events.push({
        pid: currentProcess.pid,
        start,
        end
      });

      currentTime = end;
      lastPid = currentProcess.pid;
      
      // Metrics
      log(`Time ${currentTime}: ${currentProcess.pid} completed`);
      completionTimes[currentProcess.pid] = end;
      turnaroundTimes[currentProcess.pid] = end - currentProcess.arrival;
      waitingTimes[currentProcess.pid] = turnaroundTimes[currentProcess.pid] - currentProcess.burst;

      completedCount++;
    }
  }

  // Aggregate metrics
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
