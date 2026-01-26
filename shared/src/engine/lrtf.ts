import {
  GanttEvent,
  Metrics,
  Process,
  SimulationResult,
  SimulationOptions,
  DecisionLog,
} from '../types.js';
import { generateSnapshots } from './utils.js';

/**
 * LRTF (Longest Remaining Time First)
 * Preemptive version of LJF.
 */
export function runLRTF(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const { contextSwitchOverhead = 0, enableLogging = false } = options;
  const logs: string[] = [];
  const stepLogs: DecisionLog[] = [];

  const log = (msg: string) => {
    if (enableLogging) logs.push(msg);
  };

  const logDecision = (
    time: number,
    coreId: number,
    message: string,
    reason: string,
    queueState: string[]
  ) => {
    if (enableLogging) stepLogs.push({ time, coreId, message, reason, queueState });
  };

  // 1. Setup working copy with 'remaining' burst time
  const processes = inputProcesses.map((p) => ({
    ...p,
    remaining: p.burst,
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
    processes.filter((p) => p.arrival <= time && p.remaining > 0);

  while (completedCount < totalProcesses) {
    const readyQueue = getReadyProcesses(currentTime);

    // If nothing is ready, jump to the next arrival
    if (readyQueue.length === 0) {
      const pending = processes.filter((p) => p.remaining > 0);
      if (pending.length === 0) break;

      const nextArrival = Math.min(...pending.map((p) => p.arrival));
      log(`Time ${currentTime}: System IDLE until ${nextArrival}`);
      logDecision(
        currentTime,
        0,
        `IDLE until ${nextArrival}`,
        `No processes ready. Waiting for next arrival at ${nextArrival}.`,
        []
      );

      events.push({
        pid: 'IDLE',
        start: currentTime,
        end: nextArrival,
      });
      currentTime = nextArrival;
      lastPid = 'IDLE';
      continue;
    }

    // Select process with LONGEST remaining time
    // Tie-breaker: Arrival time (FCFS for ties)
    readyQueue.sort((a, b) => {
      if (a.remaining !== b.remaining) return b.remaining - a.remaining;
      return a.arrival - b.arrival;
    });

    const queueState = readyQueue.map((p) => `${p.pid}(Rem:${p.remaining})`);
    const currentProcess = readyQueue[0];

    // Log Decision
    logDecision(
      currentTime,
      0,
      `Selected ${currentProcess.pid}`,
      `Selected ${currentProcess.pid} because it has the longest remaining time (${currentProcess.remaining}).`,
      queueState
    );

    // Context Switch Overhead
    if (
      contextSwitchOverhead > 0 &&
      lastPid !== 'IDLE' &&
      lastPid !== currentProcess.pid &&
      lastPid !== 'CS'
    ) {
      log(`Time ${currentTime}: Context Switch from ${lastPid} to ${currentProcess.pid}`);
      events.push({
        pid: 'CS',
        start: currentTime,
        end: currentTime + contextSwitchOverhead,
      });
      currentTime += contextSwitchOverhead;
      // Re-evaluate ready queue after overhead
      continue;
    }

    // Determine how long to run
    // LRTF needs to check at every tick or whenever a new process arrives,
    // OR whenever the current process's remaining time drops below another process's remaining time.
    // To keep it simple and accurate for visualization, we can run for 1 time unit at a time,
    // or until the next arrival.
    // Actually, in LRTF, if P1 has 10 and P2 has 8, they might swap multiple times.

    let runTime = 1; // Default to 1 unit for accuracy in preemptive sorting

    // Find next arrival or next potential "remaining time crossover"
    const nextArrival = processes
      .filter((p) => p.arrival > currentTime && p.remaining > 0)
      .reduce((min, p) => Math.min(min, p.arrival), Infinity);

    // Time to next arrival
    const timeToArrival = nextArrival - currentTime;

    // If no one is arriving soon, we still need to check if another ready process
    // will catch up in remaining time. But wait, in LRTF, the current one's remaining time
    // decreases, so it will only become SMALLER than others.
    // Thus, we must re-evaluate if anyone else in the ready queue now has a LARGER remaining time.

    // Since we re-run the loop, setting runTime to 1 or timeToArrival (if < 1) is safest.
    runTime = Math.min(1, timeToArrival);

    log(
      `Time ${currentTime}: ${currentProcess.pid} runs for ${runTime}ms (Rem: ${currentProcess.remaining})`
    );

    // Create/Extend Event
    const lastEvent = events[events.length - 1];
    if (lastEvent && lastEvent.pid === currentProcess.pid) {
      lastEvent.end += runTime;
    } else {
      events.push({
        pid: currentProcess.pid,
        start: currentTime,
        end: currentTime + runTime,
      });
    }

    currentProcess.remaining -= runTime;
    currentTime += runTime;
    lastPid = currentProcess.pid;

    if (currentProcess.remaining <= 0) {
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
  for (let i = 0; i < events.length - 1; i++) {
    if (
      events[i].pid !== events[i + 1].pid &&
      events[i].pid !== 'IDLE' &&
      events[i + 1].pid !== 'IDLE'
    ) {
      contextSwitches++;
    }
  }

  // Calculate Active Time
  let activeTime = 0;
  let idleTime = 0;
  events.forEach((e) => {
    const duration = e.end - e.start;
    if (e.pid === 'IDLE') idleTime += duration;
    else if (e.pid !== 'CS') activeTime += duration;
  });

  const totalTime = events.length > 0 ? events[events.length - 1].end : 1;
  const cpuUtilization = (activeTime / totalTime) * 100;

  const metrics: Metrics = {
    completion: completionTimes,
    turnaround: turnaroundTimes,
    waiting: waitingTimes,
    avgTurnaround: totalProcesses > 0 ? totalTurnaround / totalProcesses : 0,
    avgWaiting: totalProcesses > 0 ? totalWaiting / totalProcesses : 0,
    contextSwitches,
    cpuUtilization,
    energy: {
      totalEnergy: activeTime * 20 + idleTime * 5 + contextSwitches * 0.1,
      activeEnergy: activeTime * 20,
      idleEnergy: idleTime * 5,
      switchEnergy: contextSwitches * 0.1,
    },
  };

  return {
    events,
    metrics,
    snapshots: generateSnapshots(events, inputProcesses),
    logs: enableLogging ? logs : undefined,
    stepLogs: enableLogging ? stepLogs : undefined,
  };
}
