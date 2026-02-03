import { GanttEvent, Process, SimulationResult, SimulationOptions, DecisionLog } from '../types.js';
import { generateSnapshots, calculateMetrics } from './utils.js';

/**
 * HRRN (Highest Response Ratio Next)
 * Response Ratio = (Waiting Time + Burst Time) / Burst Time
 */
export function runHRRN(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const { contextSwitchOverhead = 0, enableLogging = false, coreCount = 1 } = options;

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

  // Deep copy
  const processes = inputProcesses.map((p) => ({ ...p }));
  processes.sort((a, b) => a.arrival - b.arrival);

  const events: GanttEvent[] = [];
  const readyQueue: Process[] = [];
  let pIndex = 0;
  let completedCount = 0;
  const totalProcesses = processes.length;

  interface CoreState {
    id: number;
    currentTime: number;
    lastPid: string | 'IDLE' | 'CS';
  }

  const cores: CoreState[] = Array.from({ length: coreCount }, (_, i) => ({
    id: i,
    currentTime: 0,
    lastPid: 'IDLE',
  }));

  let systemTime = 0;

  while (completedCount < totalProcesses) {
    // 1. Enqueue arrivals
    while (pIndex < totalProcesses && processes[pIndex].arrival <= systemTime) {
      log(`Time ${systemTime}: Process ${processes[pIndex].pid} arrived`);
      readyQueue.push(processes[pIndex]);
      pIndex++;
    }

    // 2. Select Highest Response Ratio for available cores
    cores.sort((a, b) => a.currentTime - b.currentTime || a.id - b.id);

    let assignedThisStep = false;
    for (const core of cores) {
      if (core.currentTime <= systemTime && readyQueue.length > 0) {
        let selectedIndex = -1;
        let maxRatio = -1;
        const queueState: string[] = [];

        readyQueue.forEach((p, idx) => {
          const waitTime = core.currentTime - p.arrival;
          const responseRatio = (waitTime + p.burst) / p.burst;
          queueState.push(`${p.pid}(RR:${responseRatio.toFixed(2)})`);

          if (responseRatio > maxRatio) {
            maxRatio = responseRatio;
            selectedIndex = idx;
          } else if (responseRatio === maxRatio) {
            if (p.arrival < readyQueue[selectedIndex].arrival) {
              selectedIndex = idx;
            }
          }
        });

        const currentProcess = readyQueue.splice(selectedIndex, 1)[0];

        logDecision(
          core.currentTime,
          core.id,
          `Selected ${currentProcess.pid}`,
          `Selected ${currentProcess.pid} with the highest Response Ratio: ${maxRatio.toFixed(2)}`,
          queueState
        );

        if (
          contextSwitchOverhead > 0 &&
          core.lastPid !== 'IDLE' &&
          core.lastPid !== currentProcess.pid &&
          core.lastPid !== 'CS'
        ) {
          events.push({
            pid: 'CS',
            start: core.currentTime,
            end: core.currentTime + contextSwitchOverhead,
            coreId: core.id,
          });
          core.currentTime += contextSwitchOverhead;
        }

        const start = core.currentTime;
        const end = start + currentProcess.burst;
        events.push({ pid: currentProcess.pid, start, end, coreId: core.id });

        core.currentTime = end;
        core.lastPid = currentProcess.pid;
        completedCount++;
        assignedThisStep = true;
      }
    }

    const nextArrival = pIndex < totalProcesses ? processes[pIndex].arrival : Infinity;
    const nextCoreFree = Math.min(...cores.map((c) => c.currentTime));
    const nextTime = Math.min(nextArrival, nextCoreFree);

    if (nextTime === Infinity && readyQueue.length === 0) break;

    if (
      readyQueue.length === 0 &&
      pIndex < totalProcesses &&
      nextArrival > systemTime &&
      cores.every((c) => c.currentTime <= systemTime)
    ) {
      for (const core of cores) {
        if (core.currentTime <= systemTime) {
          events.push({ pid: 'IDLE', start: core.currentTime, end: nextArrival, coreId: core.id });
          core.currentTime = nextArrival;
          core.lastPid = 'IDLE';
        }
      }
      systemTime = nextArrival;
    } else if (nextTime > systemTime) {
      systemTime = nextTime;
    } else if (!assignedThisStep && readyQueue.length === 0 && pIndex < totalProcesses) {
      systemTime = nextArrival;
    } else {
      const earliestBusyCoreFinish = Math.min(
        ...cores.filter((c) => c.currentTime > systemTime).map((c) => c.currentTime)
      );
      systemTime = earliestBusyCoreFinish !== Infinity ? earliestBusyCoreFinish : systemTime + 1;
    }
    systemTime = Math.round(systemTime * 100) / 100;
  }

  const metrics = calculateMetrics(events, inputProcesses, options);

  return {
    events,
    metrics,
    snapshots: generateSnapshots(events, inputProcesses, coreCount),
    logs: enableLogging ? logs : undefined,
    stepLogs: enableLogging ? stepLogs : undefined,
  };
}
