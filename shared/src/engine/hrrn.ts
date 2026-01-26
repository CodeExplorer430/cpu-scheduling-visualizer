import { GanttEvent, Metrics, Process, SimulationResult, SimulationOptions, DecisionLog } from '../types.js';
import { generateSnapshots } from './utils.js';

/**
 * HRRN (Highest Response Ratio Next)
 * Response Ratio = (Waiting Time + Burst Time) / Burst Time
 */
export function runHRRN(
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

  // Deep copy
  const processes = inputProcesses.map((p) => ({ ...p }));
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
    // 1. Enqueue arrivals
    while (pIndex < totalProcesses && processes[pIndex].arrival <= currentTime) {
      log(`Time ${currentTime}: Process ${processes[pIndex].pid} arrived`);
      readyQueue.push(processes[pIndex]);
      pIndex++;
    }

    // 2. Idle handling
    if (readyQueue.length === 0) {
      if (pIndex < totalProcesses) {
        const nextArrival = processes[pIndex].arrival;
        logDecision(currentTime, 0, `IDLE until ${nextArrival}`, `Ready queue empty.`, []);
        events.push({ pid: 'IDLE', start: currentTime, end: nextArrival });
        currentTime = nextArrival;
        lastPid = 'IDLE';
        continue;
      }
    }

    // 3. Calculate Response Ratios and select Highest
    // RR = (Waiting Time + Burst Time) / Burst Time
    let selectedIndex = -1;
    let maxRatio = -1;
    const queueState: string[] = [];

    readyQueue.forEach((p, idx) => {
      const waitTime = currentTime - p.arrival;
      const responseRatio = (waitTime + p.burst) / p.burst;
      queueState.push(`${p.pid}(RR:${responseRatio.toFixed(2)})`);

      if (responseRatio > maxRatio) {
        maxRatio = responseRatio;
        selectedIndex = idx;
      } else if (responseRatio === maxRatio) {
        // Tie-breaker: earlier arrival or FCFS
        if (p.arrival < readyQueue[selectedIndex].arrival) {
          selectedIndex = idx;
        }
      }
    });

    const currentProcess = readyQueue.splice(selectedIndex, 1)[0];

    if (currentProcess) {
      const waitTime = currentTime - currentProcess.arrival;
      logDecision(
        currentTime,
        0,
        `Selected ${currentProcess.pid}`,
        `Selected ${currentProcess.pid} with the highest Response Ratio: (${waitTime} + ${currentProcess.burst}) / ${currentProcess.burst} = ${maxRatio.toFixed(2)}`,
        queueState
      );

      // Context Switch
      if (
        contextSwitchOverhead > 0 &&
        lastPid !== 'IDLE' &&
        lastPid !== currentProcess.pid &&
        lastPid !== 'CS'
      ) {
        events.push({ pid: 'CS', start: currentTime, end: currentTime + contextSwitchOverhead });
        currentTime += contextSwitchOverhead;
        // Re-check arrivals
        while (pIndex < totalProcesses && processes[pIndex].arrival <= currentTime) {
          readyQueue.push(processes[pIndex]);
          pIndex++;
        }
      }

      const start = currentTime;
      const end = start + currentProcess.burst;
      events.push({ pid: currentProcess.pid, start, end });

      currentTime = end;
      lastPid = currentProcess.pid;

      // Metrics
      completionTimes[currentProcess.pid] = end;
      turnaroundTimes[currentProcess.pid] = end - currentProcess.arrival;
      waitingTimes[currentProcess.pid] = turnaroundTimes[currentProcess.pid] - currentProcess.burst;
      completedCount++;
    }
  }

  // Aggregate Metrics
  const totalTurnaround = Object.values(turnaroundTimes).reduce((sum, val) => sum + val, 0);
  const totalWaiting = Object.values(waitingTimes).reduce((sum, val) => sum + val, 0);

  let contextSwitches = 0;
  for (let i = 0; i < events.length - 1; i++) {
    if (events[i].pid !== events[i + 1].pid && events[i].pid !== 'IDLE' && events[i + 1].pid !== 'IDLE') {
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
