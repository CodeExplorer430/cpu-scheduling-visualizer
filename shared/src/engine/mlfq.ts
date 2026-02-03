import { GanttEvent, Process, SimulationResult, SimulationOptions, DecisionLog } from '../types.js';
import { generateSnapshots, calculateMetrics } from './utils.js';

interface MLFQProcess extends Process {
  remaining: number;
  currentQueue: number; // 0 (High), 1 (Medium), 2 (Low)
  timeInCurrentQuantum: number;
}

export function runMLFQ(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const { contextSwitchOverhead = 0, coreCount = 1, enableLogging = false } = options;

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

  const processes: MLFQProcess[] = inputProcesses.map((p) => ({
    ...p,
    remaining: p.burst,
    currentQueue: 0,
    timeInCurrentQuantum: 0,
  }));

  processes.sort((a, b) => a.arrival - b.arrival);

  let systemTime = 0;
  let completedCount = 0;
  const totalProcesses = processes.length;
  const events: GanttEvent[] = [];

  const queues: MLFQProcess[][] = [[], [], []];
  const quantums = [2, 4, Infinity];

  let pIndex = 0;

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

  while (completedCount < totalProcesses) {
    // 1. Arrivals
    while (pIndex < totalProcesses && processes[pIndex].arrival <= systemTime) {
      log(`Time ${systemTime}: Process ${processes[pIndex].pid} arrived -> Q0`);
      queues[0].push(processes[pIndex]);
      pIndex++;
    }

    cores.sort((a, b) => a.id - b.id);

    // 2. Scheduler Logic (Preemption and Assignment)
    for (const core of cores) {
      if (core.currentTime <= systemTime) {
        const currentlyRunningPids = cores
          .filter((c) => c.currentProcessPid && c.currentProcessPid !== 'CS')
          .map((c) => c.currentProcessPid!);

        // If core is running something, check if there's a higher priority queue with a process ready
        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
          const current = processes.find((p) => p.pid === core.currentProcessPid)!;
          const currentQueueIdx = current.currentQueue;

          let higherPriorityReady = false;
          for (let i = 0; i < currentQueueIdx; i++) {
            if (queues[i].filter((p) => !currentlyRunningPids.includes(p.pid)).length > 0) {
              higherPriorityReady = true;
              break;
            }
          }

          if (higherPriorityReady || current.timeInCurrentQuantum >= quantums[currentQueueIdx]) {
            // Preempt or demote
            if (current.timeInCurrentQuantum >= quantums[currentQueueIdx]) {
              logDecision(
                systemTime,
                core.id,
                `Demoting ${current.pid}`,
                `Quantum expired in Q${currentQueueIdx}. Moving to Q${Math.min(2, currentQueueIdx + 1)}.`,
                []
              );
              queues[currentQueueIdx].shift();
              const nextQueue = Math.min(2, currentQueueIdx + 1);
              current.currentQueue = nextQueue;
              current.timeInCurrentQuantum = 0;
              queues[nextQueue].push(current);
            } else if (higherPriorityReady) {
              logDecision(
                systemTime,
                core.id,
                `Preempting ${current.pid}`,
                `Higher priority process ready.`,
                []
              );
            }
            core.currentProcessPid = undefined;
          }
        }

        // Assignment if core is free
        if (!core.currentProcessPid) {
          const currentlyRunning = cores
            .filter((c) => c.currentProcessPid && c.currentProcessPid !== 'CS')
            .map((c) => c.currentProcessPid!);
          let selected: MLFQProcess | undefined;

          for (let i = 0; i < 3; i++) {
            const available = queues[i].filter((p) => !currentlyRunning.includes(p.pid));
            if (available.length > 0) {
              selected = available[0];
              logDecision(
                systemTime,
                core.id,
                `Selected ${selected.pid}`,
                `Selected from Q${i} (highest priority available queue).`,
                available.map((p) => p.pid)
              );
              break;
            }
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

    // 3. Execution step
    const nextArrival =
      processes.filter((p) => p.arrival > systemTime).length > 0
        ? Math.min(...processes.filter((p) => p.arrival > systemTime).map((p) => p.arrival))
        : Infinity;

    const nextCoreFree =
      cores.filter((c) => c.currentTime > systemTime).length > 0
        ? Math.min(...cores.filter((c) => c.currentTime > systemTime).map((c) => c.currentTime))
        : Infinity;

    const nextQuantumOrCompletion =
      cores.filter((c) => c.currentProcessPid && c.currentProcessPid !== 'CS').length > 0
        ? Math.min(
            ...cores
              .filter((c) => c.currentProcessPid && c.currentProcessPid !== 'CS')
              .map((c) => {
                const p = processes.find((proc) => proc.pid === c.currentProcessPid)!;
                const timeToQuantum = quantums[p.currentQueue] - p.timeInCurrentQuantum;
                return systemTime + Math.min(p.remaining, timeToQuantum);
              })
          )
        : Infinity;

    const nextEventTime = Math.min(nextArrival, nextCoreFree, nextQuantumOrCompletion);

    if (nextEventTime === Infinity && processes.every((p) => p.remaining <= 0)) break;

    const duration = nextEventTime - systemTime;
    if (duration > 0) {
      for (const core of cores) {
        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
          const p = processes.find((proc) => proc.pid === core.currentProcessPid)!;
          const lastEvent = events.filter((e) => (e.coreId ?? 0) === core.id).pop();
          if (lastEvent && lastEvent.pid === p.pid && lastEvent.end === systemTime)
            lastEvent.end = nextEventTime;
          else events.push({ pid: p.pid, start: systemTime, end: nextEventTime, coreId: core.id });

          p.remaining -= duration;
          p.timeInCurrentQuantum += duration;
          core.currentTime = nextEventTime;
          core.lastPid = p.pid;

          if (p.remaining <= 0) {
            completedCount++;
            core.currentProcessPid = undefined;
            queues[p.currentQueue].shift();
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

  const metrics = calculateMetrics(events, inputProcesses, options);

  return {
    events,
    metrics,
    snapshots: generateSnapshots(events, inputProcesses, coreCount),
    logs: enableLogging ? logs : undefined,
    stepLogs: enableLogging ? stepLogs : undefined,
  };
}
