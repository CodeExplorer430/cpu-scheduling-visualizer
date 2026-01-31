import { GanttEvent, Metrics, Process, SimulationResult, SimulationOptions } from '../types.js';
import { generateSnapshots } from './utils.js';

interface MQProcess extends Process {
  remaining: number;
}

export function runMQ(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const {
    contextSwitchOverhead = 0,
    quantum = 2,
    coreCount = 1,
    energyConfig = { activeWatts: 20, idleWatts: 5, switchJoules: 0.1 },
  } = options;

  const processes: MQProcess[] = inputProcesses.map((p) => ({
    ...p,
    remaining: p.burst,
  }));

  processes.sort((a, b) => a.arrival - b.arrival);

  let systemTime = 0;
  let completedCount = 0;
  const totalProcesses = processes.length;
  const events: GanttEvent[] = [];

  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};

  const q1: MQProcess[] = []; // RR (Priority === 1)
  const q2: MQProcess[] = []; // FCFS (Priority > 1)

  let pIndex = 0;

  interface CoreState {
    id: number;
    currentTime: number;
    lastPid: string | 'IDLE' | 'CS';
    currentProcessPid?: string;
    rrQuantumProgress: number;
  }

  const cores: CoreState[] = Array.from({ length: coreCount }, (_, i) => ({
    id: i,
    currentTime: 0,
    lastPid: 'IDLE',
    rrQuantumProgress: 0,
  }));

  while (completedCount < totalProcesses) {
    while (pIndex < totalProcesses && processes[pIndex].arrival <= systemTime) {
      const p = processes[pIndex];
      if (p.priority === 1) q1.push(p);
      else q2.push(p);
      pIndex++;
    }

    cores.sort((a, b) => a.id - b.id);

    for (const core of cores) {
      if (core.currentTime <= systemTime) {
        const currentlyRunningPids = cores
          .filter((c) => c.currentProcessPid && c.currentProcessPid !== 'CS')
          .map((c) => c.currentProcessPid!);

        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
          const current = processes.find((p) => p.pid === core.currentProcessPid)!;
          if (
            current.priority > 1 &&
            q1.filter((p) => !currentlyRunningPids.includes(p.pid)).length > 0
          ) {
            core.currentProcessPid = undefined;
          } else if (current.priority === 1 && core.rrQuantumProgress >= quantum) {
            q1.shift();
            q1.push(current);
            core.rrQuantumProgress = 0;
            core.currentProcessPid = undefined;
          }
        }

        if (!core.currentProcessPid) {
          const currentlyRunningPids = cores
            .filter((c) => c.currentProcessPid && c.currentProcessPid !== 'CS')
            .map((c) => c.currentProcessPid!);
          const availableQ1 = q1.filter((p) => !currentlyRunningPids.includes(p.pid));
          const availableQ2 = q2.filter((p) => !currentlyRunningPids.includes(p.pid));

          let selected: MQProcess | undefined;
          if (availableQ1.length > 0) {
            selected = availableQ1[0];
            core.rrQuantumProgress = 0;
          } else if (availableQ2.length > 0) {
            selected = availableQ2[0];
          }

          if (selected) {
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

    const nextArrival =
      processes.filter((p) => p.arrival > systemTime).length > 0
        ? Math.min(...processes.filter((p) => p.arrival > systemTime).map((p) => p.arrival))
        : Infinity;

    const nextCompletion =
      cores.filter((c) => c.currentProcessPid && c.currentProcessPid !== 'CS').length > 0
        ? Math.min(
            ...cores
              .filter((c) => c.currentProcessPid && c.currentProcessPid !== 'CS')
              .map((c) => {
                const p = processes.find((p) => p.pid === c.currentProcessPid)!;
                const timeToComplete = p.remaining;
                const timeToQuantum = p.priority === 1 ? quantum - c.rrQuantumProgress : Infinity;
                return systemTime + Math.min(timeToComplete, timeToQuantum);
              })
          )
        : Infinity;

    const nextCSFinish =
      cores.filter((c) => c.currentProcessPid === 'CS').length > 0
        ? Math.min(...cores.filter((c) => c.currentProcessPid === 'CS').map((c) => c.currentTime))
        : Infinity;

    const nextEventTime = Math.min(nextArrival, nextCompletion, nextCSFinish);
    if (nextEventTime === Infinity) break;

    const duration = nextEventTime - systemTime;
    if (duration > 0) {
      for (const core of cores) {
        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
          const p = processes.find((p) => p.pid === core.currentProcessPid)!;
          const lastEvent = events.filter((e) => (e.coreId ?? 0) === core.id).pop();
          if (lastEvent && lastEvent.pid === p.pid && lastEvent.end === systemTime)
            lastEvent.end = nextEventTime;
          else events.push({ pid: p.pid, start: systemTime, end: nextEventTime, coreId: core.id });

          p.remaining -= duration;
          if (p.priority === 1) core.rrQuantumProgress += duration;
          core.currentTime = nextEventTime;
          core.lastPid = p.pid;

          if (p.remaining <= 0) {
            completedCount++;
            completionTimes[p.pid] = nextEventTime;
            turnaroundTimes[p.pid] = nextEventTime - p.arrival;
            waitingTimes[p.pid] = turnaroundTimes[p.pid] - p.burst;
            core.currentProcessPid = undefined;
            if (p.priority === 1) q1.shift();
            else q2.shift();
          }
        } else if (!core.currentProcessPid) {
          const lastEvent = events.filter((e) => (e.coreId ?? 0) === core.id).pop();
          if (lastEvent && lastEvent.pid === 'IDLE' && lastEvent.end === systemTime)
            lastEvent.end = nextEventTime;
          else events.push({ pid: 'IDLE', start: systemTime, end: nextEventTime, coreId: core.id });
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

  const totalTurnaround = Object.values(turnaroundTimes).reduce((sum, val) => sum + val, 0);
  const totalWaiting = Object.values(waitingTimes).reduce((sum, val) => sum + val, 0);

  let contextSwitches = 0;
  if (contextSwitchOverhead > 0) contextSwitches = events.filter((e) => e.pid === 'CS').length;
  else {
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
      const eWithCore = e as { coreId?: number };
      delete eWithCore.coreId;
    });
  }

  return {
    events,
    metrics,
    snapshots: generateSnapshots(events, inputProcesses, coreCount),
  };
}
