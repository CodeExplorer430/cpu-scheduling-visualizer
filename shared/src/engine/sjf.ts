import {
  GanttEvent,
  Metrics,
  Process,
  SimulationResult,
  SimulationOptions,
  DecisionLog,
} from '../types.js';
import { generateSnapshots } from './utils.js';

export function runSJF(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const {
    contextSwitchOverhead = 0,
    enableLogging = false,
    coreCount = 1,
    energyConfig = { activeWatts: 20, idleWatts: 5, switchJoules: 0.1 },
  } = options;

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
  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};

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

    // 2. Select shortest burst for available cores
    cores.sort((a, b) => a.currentTime - b.currentTime || a.id - b.id);

    let assignedThisStep = false;
    for (const core of cores) {
      if (core.currentTime <= systemTime && readyQueue.length > 0) {
        readyQueue.sort((a, b) => {
          if (a.burst !== b.burst) return a.burst - b.burst;
          return a.arrival - b.arrival;
        });

        const currentProcess = readyQueue.shift()!;
        const queueState = [currentProcess.pid, ...readyQueue.map((p) => `${p.pid}(${p.burst})`)];

        logDecision(
          core.currentTime,
          core.id,
          `Selected ${currentProcess.pid}`,
          `Selected ${currentProcess.pid} because it has the shortest burst time (${currentProcess.burst}).`,
          queueState
        );

        // Context Switch
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

        events.push({
          pid: currentProcess.pid,
          start,
          end,
          coreId: core.id,
        });

        core.currentTime = end;
        core.lastPid = currentProcess.pid;
        completedCount++;
        assignedThisStep = true;

        completionTimes[currentProcess.pid] = end;
        turnaroundTimes[currentProcess.pid] = end - currentProcess.arrival;
        waitingTimes[currentProcess.pid] =
          turnaroundTimes[currentProcess.pid] - currentProcess.burst;
      }
    }

    // 3. Advance system time
    const nextArrival = pIndex < totalProcesses ? processes[pIndex].arrival : Infinity;
    const nextCoreFree = Math.min(...cores.map((c) => c.currentTime));
    const nextTime = Math.min(nextArrival, nextCoreFree);

    if (nextTime === Infinity && readyQueue.length === 0) break;

    // Handle IDLE
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

  // Aggregate metrics
  const totalTurnaround = Object.values(turnaroundTimes).reduce((sum, val) => sum + val, 0);
  const totalWaiting = Object.values(waitingTimes).reduce((sum, val) => sum + val, 0);

  let contextSwitches = 0;
  if (contextSwitchOverhead > 0) {
    contextSwitches = events.filter((e) => e.pid === 'CS').length;
  } else {
    for (let c = 0; c < coreCount; c++) {
      const coreEvents = events
        .filter((e) => (e.coreId ?? 0) === c)
        .sort((a, b) => a.start - b.start);
      for (let i = 0; i < coreEvents.length - 1; i++) {
        if (
          coreEvents[i].pid !== coreEvents[i + 1].pid &&
          coreEvents[i].pid !== 'IDLE' &&
          coreEvents[i + 1].pid !== 'IDLE'
        ) {
          contextSwitches++;
        }
      }
    }
  }

  let activeTime = 0;
  let idleTime = 0;
  events.forEach((e) => {
    const duration = e.end - e.start;
    if (e.pid === 'IDLE') idleTime += duration;
    else if (e.pid !== 'CS') activeTime += duration;
  });

  const globalMaxTime = events.length > 0 ? Math.max(...events.map((e) => e.end)) : 0;
  const totalTime = globalMaxTime > 0 ? globalMaxTime : 1;
  const cpuUtilization = (activeTime / (totalTime * coreCount)) * 100;

  const metrics: Metrics = {
    completion: completionTimes,
    turnaround: turnaroundTimes,
    waiting: waitingTimes,
    avgTurnaround: totalProcesses > 0 ? totalTurnaround / totalProcesses : 0,
    avgWaiting: totalProcesses > 0 ? totalWaiting / totalProcesses : 0,
    contextSwitches,
    cpuUtilization,
    energy: {
      totalEnergy:
        activeTime * energyConfig.activeWatts +
        idleTime * energyConfig.idleWatts +
        contextSwitches * energyConfig.switchJoules,
      activeEnergy: activeTime * energyConfig.activeWatts,
      idleEnergy: idleTime * energyConfig.idleWatts,
      switchEnergy: contextSwitches * energyConfig.switchJoules,
    },
  };

  // Clean up coreId for single-core to keep tests happy
  if (coreCount === 1) {
    events.forEach((e) => delete e.coreId);
  }

  return {
    events,
    metrics,
    snapshots: generateSnapshots(events, inputProcesses, coreCount),
    logs: enableLogging ? logs : undefined,
    stepLogs: enableLogging ? stepLogs : undefined,
  };
}
