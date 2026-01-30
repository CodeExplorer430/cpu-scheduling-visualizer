import {
  GanttEvent,
  Metrics,
  Process,
  SimulationResult,
  SimulationOptions,
  DecisionLog,
} from '../types.js';
import { generateSnapshots } from './utils.js';

interface ProcessWithRemaining extends Process {
  remaining: number;
}

export function runRR(
  inputProcesses: Process[],
  optionsOrQuantum: SimulationOptions | number = 2
): SimulationResult {
  const options: SimulationOptions =
    typeof optionsOrQuantum === 'number' ? { quantum: optionsOrQuantum } : optionsOrQuantum;

  const {
    quantum = 2,
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

  // Deep copy + add remaining burst
  const processes: ProcessWithRemaining[] = inputProcesses.map((p) => ({
    ...p,
    remaining: p.burst,
  }));

  // Sort by arrival initially
  const sortedByArrival = [...processes].sort((a, b) => a.arrival - b.arrival);

  const events: GanttEvent[] = [];
  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};

  const readyQueue: ProcessWithRemaining[] = [];
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

  // Simulation Clock
  let systemTime = 0;

  while (completedCount < totalProcesses) {
    // 1. Enqueue arrivals up to systemTime
    while (pIndex < totalProcesses && sortedByArrival[pIndex].arrival <= systemTime) {
      readyQueue.push(sortedByArrival[pIndex]);
      log(`Time ${systemTime}: Process ${sortedByArrival[pIndex].pid} arrived`);
      pIndex++;
    }

    // 2. Assign available cores to processes in readyQueue
    // Sort cores by currentTime to always pick earliest available
    cores.sort((a, b) => a.currentTime - b.currentTime || a.id - b.id);

    let assignedThisStep = false;
    for (const core of cores) {
      // If core is free and queue not empty
      if (core.currentTime <= systemTime && readyQueue.length > 0) {
        const currentProcess = readyQueue.shift()!;
        const queueState = [currentProcess.pid, ...readyQueue.map((p) => p.pid)];

        logDecision(
          core.currentTime,
          core.id,
          `Selected ${currentProcess.pid}`,
          `Selected ${currentProcess.pid} from head of queue. Quantum: ${quantum}.`,
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

        const runTime = Math.min(currentProcess.remaining, quantum);
        const start = core.currentTime;
        const end = start + runTime;

        events.push({
          pid: currentProcess.pid,
          start,
          end,
          coreId: core.id,
        });

        core.currentTime = end;
        currentProcess.remaining -= runTime;
        core.lastPid = currentProcess.pid;
        assignedThisStep = true;

        if (currentProcess.remaining > 0) {
          (currentProcess as any).nextAvailableAt = end;
        } else {
          completedCount++;
          completionTimes[currentProcess.pid] = end;
          turnaroundTimes[currentProcess.pid] = end - currentProcess.arrival;
          waitingTimes[currentProcess.pid] = turnaroundTimes[currentProcess.pid] - currentProcess.burst;
        }
      }
    }

    // 3. Advance system time
    const nextArrival = pIndex < totalProcesses ? sortedByArrival[pIndex].arrival : Infinity;
    
    // Core available times
    const nextCoreFree = Math.min(...cores.map((c) => c.currentTime));
    
    // Check processes that were running and now need re-queueing
    const sliceFinishedProcesses = processes.filter(p => 
      p.remaining > 0 && 
      (p as any).nextAvailableAt !== undefined
    );
    const nextSliceFinish = sliceFinishedProcesses.length > 0 
      ? Math.min(...sliceFinishedProcesses.map(p => (p as any).nextAvailableAt))
      : Infinity;

    // Next event time
    const nextEventTime = Math.min(nextArrival, nextCoreFree, nextSliceFinish);

    if (nextEventTime === Infinity && readyQueue.length === 0) break;

    // Handle IDLE time if all cores are busy or queue is empty
    if (readyQueue.length === 0 && pIndex < totalProcesses && nextArrival > systemTime && cores.every(c => c.currentTime <= systemTime)) {
        // Find if any core idled
        for (const core of cores) {
            if (core.currentTime <= systemTime) {
                events.push({
                    pid: 'IDLE',
                    start: core.currentTime,
                    end: nextArrival,
                    coreId: core.id
                });
                core.currentTime = nextArrival;
                core.lastPid = 'IDLE';
            }
        }
        systemTime = nextArrival;
    } else if (nextEventTime > systemTime) {
      systemTime = nextEventTime;
    } else if (!assignedThisStep && readyQueue.length === 0 && pIndex >= totalProcesses && sliceFinishedProcesses.length > 0) {
        // If we are waiting for a slice to finish
        systemTime = nextSliceFinish;
    } else if (!assignedThisStep && readyQueue.length === 0 && pIndex < totalProcesses) {
        systemTime = nextArrival;
    } else {
      // Avoid infinite loop if we can't advance
      const earliestBusyCoreFinish = Math.min(...cores.filter(c => c.currentTime > systemTime).map(c => c.currentTime));
      systemTime = earliestBusyCoreFinish !== Infinity ? earliestBusyCoreFinish : systemTime + 1;
    }

    // Rounding
    systemTime = Math.round(systemTime * 100) / 100;

    // Re-queue processes whose slice finished up to systemTime
    processes.forEach(p => {
      if (p.remaining > 0 && (p as any).nextAvailableAt !== undefined && (p as any).nextAvailableAt <= systemTime) {
        readyQueue.push(p);
        delete (p as any).nextAvailableAt;
      }
    });
  }

  // Aggregate Metrics
  const totalTurnaround = Object.values(turnaroundTimes).reduce((sum, val) => sum + val, 0);
  const totalWaiting = Object.values(waitingTimes).reduce((sum, val) => sum + val, 0);

  let contextSwitches = 0;
  if (contextSwitchOverhead > 0) {
    contextSwitches = events.filter((e) => e.pid === 'CS').length;
  } else {
    for (let c = 0; c < coreCount; c++) {
      const coreEvents = events.filter((e) => (e.coreId ?? 0) === c).sort((a, b) => a.start - b.start);
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
      totalEnergy: activeTime * energyConfig.activeWatts + idleTime * energyConfig.idleWatts + contextSwitches * energyConfig.switchJoules,
      activeEnergy: activeTime * energyConfig.activeWatts,
      idleEnergy: idleTime * energyConfig.idleWatts,
      switchEnergy: contextSwitches * energyConfig.switchJoules,
    },
  };

  // Clean up coreId for single-core to keep tests happy
  if (coreCount === 1) {
    events.forEach(e => delete e.coreId);
  }

  return {
    events,
    metrics,
    snapshots: generateSnapshots(events, inputProcesses, coreCount),
    logs: enableLogging ? logs : undefined,
    stepLogs: enableLogging ? stepLogs : undefined,
  };
}
