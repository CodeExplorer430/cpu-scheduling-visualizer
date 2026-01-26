import { GanttEvent, Metrics, Process, SimulationResult, SimulationOptions, DecisionLog } from '../types.js';
import { generateSnapshots } from './utils.js';

export function runLJF(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const { contextSwitchOverhead = 0, enableLogging = false } = options;
  const logs: string[] = [];
  const stepLogs: DecisionLog[] = [];

  const log = (msg: string) => {
    if (enableLogging) logs.push(msg);
  };

  const logDecision = (time: number, coreId: number, message: string, reason: string, queueState: string[]) => {
    if (enableLogging) stepLogs.push({ time, coreId, message, reason, queueState });
  };

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
        logDecision(currentTime, 0, `IDLE until ${nextArrival}`, `Ready queue empty. Waiting for next arrival.`, []);

        events.push({
          pid: 'IDLE',
          start: currentTime,
          end: nextArrival,
        });
        currentTime = nextArrival;
        lastPid = 'IDLE';
        continue;
      }
    }

    // 3. Select process with longest burst time (LJF Logic)
    readyQueue.sort((a, b) => {
      if (a.burst !== b.burst) return b.burst - a.burst; // Descending order
      return a.arrival - b.arrival; // FIFO tie-breaker
    });

    const queueState = readyQueue.map(p => `${p.pid}(Burst:${p.burst})`);

    const currentProcess = readyQueue.shift();
    if (currentProcess) {
      logDecision(
        currentTime, 
        0, 
        `Selected ${currentProcess.pid}`, 
        `Selected ${currentProcess.pid} because it has the longest burst time (${currentProcess.burst}).`, 
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
        // Re-check arrivals
        while (pIndex < totalProcesses && processes[pIndex].arrival <= currentTime) {
          readyQueue.push(processes[pIndex]);
          pIndex++;
        }
      }

      const start = currentTime;
      const end = start + currentProcess.burst;
      log(
        `Time ${currentTime}: ${currentProcess.pid} starts execution (Burst: ${currentProcess.burst})`
      );

      events.push({
        pid: currentProcess.pid,
        start,
        end,
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
    contextSwitches = events.filter((e) => e.pid === 'CS').length;
  } else {
    for (let i = 0; i < events.length - 1; i++) {
      if (
        events[i].pid !== events[i + 1].pid &&
        events[i].pid !== 'IDLE' &&
        events[i + 1].pid !== 'IDLE'
      ) {
        contextSwitches++;
      }
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

  const totalEnergy =
    activeTime * (options.energyConfig?.activeWatts ?? 20) +
    idleTime * (options.energyConfig?.idleWatts ?? 5) +
    contextSwitches * (options.energyConfig?.switchJoules ?? 0.1);
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
      totalEnergy,
      activeEnergy: activeTime * (options.energyConfig?.activeWatts ?? 20),
      idleEnergy: idleTime * (options.energyConfig?.idleWatts ?? 5),
      switchEnergy: contextSwitches * (options.energyConfig?.switchJoules ?? 0.1),
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
