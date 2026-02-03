import { GanttEvent, Process, SimulationResult, SimulationOptions, DecisionLog } from '../types.js';
import { generateSnapshots, calculateMetrics } from './utils.js';

interface ProcessWithRemaining extends Process {
  remaining: number;
  nextAvailableAt?: number;
}

export function runRR(
  inputProcesses: Process[],
  optionsOrQuantum: SimulationOptions | number = 2
): SimulationResult {
  const options: SimulationOptions =
    typeof optionsOrQuantum === 'number' ? { quantum: optionsOrQuantum } : optionsOrQuantum;

  const { quantum = 2, contextSwitchOverhead = 0, enableLogging = false, coreCount = 1 } = options;

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
    cores.sort((a, b) => a.currentTime - b.currentTime || a.id - b.id);

    let assignedThisStep = false;
    for (const core of cores) {
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
          currentProcess.nextAvailableAt = end;
        } else {
          completedCount++;
        }
      }
    }

    const nextArrival = pIndex < totalProcesses ? sortedByArrival[pIndex].arrival : Infinity;
    const nextCoreFree = Math.min(...cores.map((c) => c.currentTime));

    const sliceFinishedProcesses = processes.filter(
      (p) => p.remaining > 0 && p.nextAvailableAt !== undefined
    );
    const nextSliceFinish =
      sliceFinishedProcesses.length > 0
        ? Math.min(...sliceFinishedProcesses.map((p) => p.nextAvailableAt!))
        : Infinity;

    const nextEventTime = Math.min(nextArrival, nextCoreFree, nextSliceFinish);

    if (nextEventTime === Infinity && readyQueue.length === 0) break;

    if (
      readyQueue.length === 0 &&
      pIndex < totalProcesses &&
      nextArrival > systemTime &&
      cores.every((c) => c.currentTime <= systemTime)
    ) {
      for (const core of cores) {
        if (core.currentTime <= systemTime) {
          events.push({
            pid: 'IDLE',
            start: core.currentTime,
            end: nextArrival,
            coreId: core.id,
          });
          core.currentTime = nextArrival;
          core.lastPid = 'IDLE';
        }
      }
      systemTime = nextArrival;
    } else if (nextEventTime > systemTime) {
      systemTime = nextEventTime;
    } else if (
      !assignedThisStep &&
      readyQueue.length === 0 &&
      pIndex >= totalProcesses &&
      sliceFinishedProcesses.length > 0
    ) {
      systemTime = nextSliceFinish;
    } else if (!assignedThisStep && readyQueue.length === 0 && pIndex < totalProcesses) {
      systemTime = nextArrival;
    } else {
      const earliestBusyCoreFinish = Math.min(
        ...cores.filter((c) => c.currentTime > systemTime).map((c) => c.currentTime)
      );
      systemTime = earliestBusyCoreFinish !== Infinity ? earliestBusyCoreFinish : systemTime + 1;
    }

    systemTime = Math.round(systemTime * 100) / 100;

    processes.forEach((p) => {
      if (p.remaining > 0 && p.nextAvailableAt !== undefined && p.nextAvailableAt <= systemTime) {
        readyQueue.push(p);
        delete p.nextAvailableAt;
      }
    });
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
