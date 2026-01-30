import {
  GanttEvent,
  Metrics,
  Process,
  SimulationResult,
  SimulationOptions,
  DecisionLog,
} from '../types.js';
import { generateSnapshots } from './utils.js';

export function runSRTF(
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

  // 1. Setup working copy with 'remaining' burst time
  const processes = inputProcesses.map((p) => ({
    ...p,
    remaining: p.burst,
  }));

  let systemTime = 0;
  let completedCount = 0;
  const totalProcesses = processes.length;
  const events: GanttEvent[] = [];

  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};

  interface CoreState {
    id: number;
    currentTime: number;
    lastPid: string | 'IDLE' | 'CS';
    currentProcessPid?: string;
  }

  const cores: CoreState[] = Array.from({ length: coreCount }, (_, i) => ({
    id: i,
    currentTime: 0,
    lastPid: 'IDLE',
  }));

  // Helper to get ready processes (not currently running on any core)
  const getReadyQueue = (time: number, currentlyRunningPids: string[]) =>
    processes.filter((p) => p.arrival <= time && p.remaining > 0 && !currentlyRunningPids.includes(p.pid));

  while (completedCount < totalProcesses) {
    // 1. Assign or Preempt cores
    cores.sort((a, b) => a.id - b.id);

    for (const core of cores) {
      if (core.currentTime <= systemTime) {
        const currentlyRunningPids = cores.filter(c => c.currentProcessPid && c.currentProcessPid !== 'CS').map(c => c.currentProcessPid!);
        let readyQueue = getReadyQueue(systemTime, currentlyRunningPids);
        
        // If core is running something, check for preemption
        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
          const current = processes.find(p => p.pid === core.currentProcessPid)!;
          readyQueue.sort((a, b) => (a.remaining !== b.remaining ? a.remaining - b.remaining : a.arrival - b.arrival));
          
          if (readyQueue.length > 0 && readyQueue[0].remaining < current.remaining) {
            // Preempt!
            const preemptedPid = current.pid;
            const selected = readyQueue[0];
            
            logDecision(systemTime, core.id, `Preempting ${preemptedPid} for ${selected.pid}`, `New process has shorter remaining time (${selected.remaining} < ${current.remaining})`, readyQueue.map(p => p.pid));
            
            core.currentProcessPid = undefined; // Will trigger re-selection below
          }
        }

        // If core is free (or just preempted)
        if (!core.currentProcessPid) {
          readyQueue = getReadyQueue(systemTime, cores.filter(c => c.currentProcessPid && c.currentProcessPid !== 'CS').map(c => c.currentProcessPid!));
          if (readyQueue.length > 0) {
            readyQueue.sort((a, b) => (a.remaining !== b.remaining ? a.remaining - b.remaining : a.arrival - b.arrival));
            const selected = readyQueue[0];

            // Context Switch
            if (contextSwitchOverhead > 0 && core.lastPid !== 'IDLE' && core.lastPid !== selected.pid && core.lastPid !== 'CS') {
              events.push({ pid: 'CS', start: systemTime, end: systemTime + contextSwitchOverhead, coreId: core.id });
              core.currentTime = systemTime + contextSwitchOverhead;
              core.currentProcessPid = 'CS';
              core.lastPid = 'CS';
            } else {
              core.currentProcessPid = selected.pid;
            }
          }
        }
      }
    }

    // 2. Determine next event
    const nextArrival = processes.filter(p => p.arrival > systemTime).length > 0
      ? Math.min(...processes.filter(p => p.arrival > systemTime).map(p => p.arrival))
      : Infinity;
    
    const nextCompletion = cores.filter(c => c.currentProcessPid && c.currentProcessPid !== 'CS').length > 0
      ? Math.min(...cores.filter(c => c.currentProcessPid && c.currentProcessPid !== 'CS').map(c => {
          const p = processes.find(p => p.pid === c.currentProcessPid)!;
          return systemTime + p.remaining;
        }))
      : Infinity;

    const nextCSFinish = cores.filter(c => c.currentProcessPid === 'CS').length > 0
      ? Math.min(...cores.filter(c => c.currentProcessPid === 'CS').map(c => c.currentTime))
      : Infinity;

    const nextEventTime = Math.min(nextArrival, nextCompletion, nextCSFinish);

    if (nextEventTime === Infinity) break;

    const duration = nextEventTime - systemTime;
    
    if (duration > 0) {
      for (const core of cores) {
        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
          const p = processes.find(p => p.pid === core.currentProcessPid)!;
          const lastEvent = events.filter(e => (e.coreId ?? 0) === core.id).pop();
          if (lastEvent && lastEvent.pid === p.pid && lastEvent.end === systemTime) {
            lastEvent.end = nextEventTime;
          } else {
            events.push({ pid: p.pid, start: systemTime, end: nextEventTime, coreId: core.id });
          }
          p.remaining -= duration;
          core.currentTime = nextEventTime;
          core.lastPid = p.pid;
          if (p.remaining <= 0) {
            completedCount++;
            completionTimes[p.pid] = nextEventTime;
            turnaroundTimes[p.pid] = nextEventTime - p.arrival;
            waitingTimes[p.pid] = turnaroundTimes[p.pid] - p.burst;
            core.currentProcessPid = undefined;
          }
        } else if (!core.currentProcessPid) {
          const lastEvent = events.filter(e => (e.coreId ?? 0) === core.id).pop();
          if (lastEvent && lastEvent.pid === 'IDLE' && lastEvent.end === systemTime) {
            lastEvent.end = nextEventTime;
          } else {
            events.push({ pid: 'IDLE', start: systemTime, end: nextEventTime, coreId: core.id });
          }
          core.currentTime = nextEventTime;
          core.lastPid = 'IDLE';
        } else if (core.currentProcessPid === 'CS') {
          if (core.currentTime <= nextEventTime) core.currentProcessPid = undefined;
        }
      }
      systemTime = nextEventTime;
    } else {
      systemTime += 0.1;
    }
    systemTime = Math.round(systemTime * 100) / 100;
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
        if (coreEvents[i].pid !== coreEvents[i + 1].pid && coreEvents[i].pid !== 'IDLE' && coreEvents[i + 1].pid !== 'IDLE') {
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

  if (coreCount === 1) events.forEach(e => delete e.coreId);

  return {
    events,
    metrics,
    snapshots: generateSnapshots(events, inputProcesses, coreCount),
    logs: enableLogging ? logs : undefined,
    stepLogs: enableLogging ? stepLogs : undefined,
  };
}
