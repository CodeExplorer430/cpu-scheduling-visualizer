import {
  GanttEvent,
  Metrics,
  Process,
  SimulationResult,
  SimulationOptions,
} from '../types.js';
import { generateSnapshots } from './utils.js';

export function runLRTF(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const {
    contextSwitchOverhead = 0,
    coreCount = 1,
    energyConfig = { activeWatts: 20, idleWatts: 5, switchJoules: 0.1 },
  } = options;

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
    busyUntil: number;
  }

  const cores: CoreState[] = Array.from({ length: coreCount }, (_, i) => ({
    id: i,
    currentTime: 0,
    lastPid: 'IDLE',
    busyUntil: 0,
  }));

  const getReadyQueue = (time: number, currentlyRunningPids: string[]) =>
    processes.filter(
      (p) => p.arrival <= time && p.remaining > 0 && !currentlyRunningPids.includes(p.pid)
    );

  while (completedCount < totalProcesses) {
    cores.sort((a, b) => a.id - b.id);

    // 1. Core assignment and Preemption check
    for (const core of cores) {
      if (systemTime >= core.busyUntil) {
        const currentlyRunningPids = cores
          .filter(
            (c) => c.currentProcessPid && c.currentProcessPid !== 'CS' && systemTime < c.busyUntil
          )
          .map((c) => c.currentProcessPid!);

        let readyQueue = getReadyQueue(systemTime, currentlyRunningPids);
        readyQueue.sort((a, b) =>
          a.remaining !== b.remaining ? b.remaining - a.remaining : a.arrival - b.arrival
        );

        // If core was running something, check for preemption
        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
          const current = processes.find((p) => p.pid === core.currentProcessPid)!;
          if (readyQueue.length > 0 && readyQueue[0].remaining > current.remaining) {
            core.currentProcessPid = undefined; // Trigger re-selection
          }
        }

        // Selection
        if (!core.currentProcessPid || systemTime >= core.busyUntil) {
          readyQueue = getReadyQueue(
            systemTime,
            cores
              .filter(
                (c) =>
                  c.currentProcessPid && c.currentProcessPid !== 'CS' && systemTime < c.busyUntil
              )
              .map((c) => c.currentProcessPid!)
          );
          readyQueue.sort((a, b) =>
            a.remaining !== b.remaining ? b.remaining - a.remaining : a.arrival - b.arrival
          );

          if (readyQueue.length > 0) {
            const selected = readyQueue[0];
            if (
              contextSwitchOverhead > 0 &&
              core.lastPid !== 'IDLE' &&
              core.lastPid !== selected.pid &&
              core.lastPid !== 'CS'
            ) {
              events.push({
                pid: 'CS',
                start: systemTime,
                end: systemTime + contextSwitchOverhead,
                coreId: core.id,
              });
              core.busyUntil = systemTime + contextSwitchOverhead;
              core.currentProcessPid = 'CS';
              core.lastPid = 'CS';
            } else {
              core.currentProcessPid = selected.pid;
              core.busyUntil = systemTime + 1; // Step by 1
            }
          } else {
            core.currentProcessPid = undefined;
            core.busyUntil = systemTime + 1;
          }
        }
      }
    }

    // 2. Advance time by 1 unit
    const nextTime = systemTime + 1;

    for (const core of cores) {
      if (
        core.currentProcessPid &&
        core.currentProcessPid !== 'CS' &&
        systemTime < core.busyUntil
      ) {
        const p = processes.find((p) => p.pid === core.currentProcessPid)!;
        const lastEvent = events.filter((e) => (e.coreId ?? 0) === core.id).pop();

        if (lastEvent && lastEvent.pid === p.pid && lastEvent.end === systemTime) {
          lastEvent.end = nextTime;
        } else {
          events.push({ pid: p.pid, start: systemTime, end: nextTime, coreId: core.id });
        }

        p.remaining -= 1;
        core.lastPid = p.pid;
        if (p.remaining <= 0) {
          completedCount++;
          completionTimes[p.pid] = nextTime;
          turnaroundTimes[p.pid] = nextTime - p.arrival;
          waitingTimes[p.pid] = turnaroundTimes[p.pid] - p.burst;
          core.currentProcessPid = undefined;
          core.busyUntil = nextTime;
        }
      } else if (!core.currentProcessPid && systemTime < core.busyUntil) {
        const lastEvent = events.filter((e) => (e.coreId ?? 0) === core.id).pop();
        if (lastEvent && lastEvent.pid === 'IDLE' && lastEvent.end === systemTime) {
          lastEvent.end = nextTime;
        } else {
          events.push({ pid: 'IDLE', start: systemTime, end: nextTime, coreId: core.id });
        }
        core.lastPid = 'IDLE';
      }
    }

    systemTime = nextTime;

    // Stop if all done
    if (processes.every((p) => p.remaining <= 0) && cores.every((c) => systemTime >= c.busyUntil))
      break;
  }

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
        )
          contextSwitches++;
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
  const cpuUtilization = (activeTime / ((globalMaxTime || 1) * coreCount)) * 100;

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

  if (coreCount === 1) {
    events.forEach((e) => {
      delete (e as GanttEvent).coreId;
    });
  }

  return {
    events,
    metrics,
    snapshots: generateSnapshots(events, inputProcesses, coreCount),
  };
}