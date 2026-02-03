import { GanttEvent, Process, SimulationResult, SimulationOptions, DecisionLog } from '../types.js';
import { generateSnapshots, calculateMetrics } from './utils.js';

export function runPriorityPreemptive(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const { contextSwitchOverhead = 0, enableLogging = false, coreCount = 1 } = options;

  const logs: string[] = [];
  const stepLogs: DecisionLog[] = [];

  const logDecision = (
    time: number,
    coreId: number,
    message: string,
    reason: string,
    queueState: string[]
  ) => {
    if (enableLogging) stepLogs.push({ time, coreId, message, reason, queueState });
  };

  const processes = inputProcesses.map((p) => ({
    ...p,
    remaining: p.burst,
  }));

  let systemTime = 0;
  let completedCount = 0;
  const totalProcesses = processes.length;
  const events: GanttEvent[] = [];

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

  const getReadyQueue = (time: number, currentlyRunningPids: string[]) =>
    processes.filter(
      (p) => p.arrival <= time && p.remaining > 0 && !currentlyRunningPids.includes(p.pid)
    );

  while (completedCount < totalProcesses) {
    cores.sort((a, b) => a.id - b.id);

    for (const core of cores) {
      if (core.currentTime <= systemTime) {
        const currentlyRunningPids = cores
          .filter((c) => c.currentProcessPid && c.currentProcessPid !== 'CS')
          .map((c) => c.currentProcessPid!);
        let readyQueue = getReadyQueue(systemTime, currentlyRunningPids);

        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
          const current = processes.find((p) => p.pid === core.currentProcessPid)!;
          readyQueue.sort((a, b) => {
            const pA = a.priority ?? Number.MAX_SAFE_INTEGER;
            const pB = b.priority ?? Number.MAX_SAFE_INTEGER;
            if (pA !== pB) return pA - pB;
            return a.arrival - b.arrival;
          });

          const currentPrio = current.priority ?? Number.MAX_SAFE_INTEGER;
          if (
            readyQueue.length > 0 &&
            (readyQueue[0].priority ?? Number.MAX_SAFE_INTEGER) < currentPrio
          ) {
            logDecision(
              systemTime,
              core.id,
              `Preempting ${current.pid} for ${readyQueue[0].pid}`,
              `New process has higher priority (${readyQueue[0].priority} < ${currentPrio})`,
              readyQueue.map((p) => p.pid)
            );
            core.currentProcessPid = undefined;
          }
        }

        if (!core.currentProcessPid) {
          readyQueue = getReadyQueue(
            systemTime,
            cores
              .filter((c) => c.currentProcessPid && c.currentProcessPid !== 'CS')
              .map((c) => c.currentProcessPid!)
          );
          if (readyQueue.length > 0) {
            readyQueue.sort((a, b) => {
              const pA = a.priority ?? Number.MAX_SAFE_INTEGER;
              const pB = b.priority ?? Number.MAX_SAFE_INTEGER;
              if (pA !== pB) return pA - pB;
              return a.arrival - b.arrival;
            });
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
                return systemTime + p.remaining;
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
            core.currentProcessPid = undefined;
          }
        } else if (!core.currentProcessPid) {
          const lastEvent = events.filter((e) => (e.coreId ?? 0) === core.id).pop();
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

  const metrics = calculateMetrics(events, inputProcesses, options);

  return {
    events,
    metrics,
    snapshots: generateSnapshots(events, inputProcesses, coreCount),
    logs: enableLogging ? logs : undefined,
    stepLogs: enableLogging ? stepLogs : undefined,
  };
}
