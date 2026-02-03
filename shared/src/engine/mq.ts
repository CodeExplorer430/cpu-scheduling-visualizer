import { GanttEvent, Process, SimulationResult, SimulationOptions, DecisionLog } from '../types.js';
import { generateSnapshots, calculateMetrics } from './utils.js';

interface MQProcess extends Process {
  remaining: number;
}

export function runMQ(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const { contextSwitchOverhead = 0, quantum = 2, coreCount = 1, enableLogging = false } = options;

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

  const processes: MQProcess[] = inputProcesses.map((p) => ({
    ...p,
    remaining: p.burst,
  }));

  processes.sort((a, b) => a.arrival - b.arrival);

  let systemTime = 0;
  let completedCount = 0;
  const totalProcesses = processes.length;
  const events: GanttEvent[] = [];

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
      const prio = p.priority ?? 2;
      log(`Time ${systemTime}: Process ${p.pid} arrived (Priority ${prio})`);
      if (prio === 1) q1.push(p);
      else q2.push(p);
      pIndex++;
    }

    cores.sort((a, b) => a.id - b.id);

    for (const core of cores) {
      if (core.currentTime <= systemTime) {
        const currentlyRunningPids = cores
          .filter((c) => c.currentProcessPid && c.currentProcessPid !== 'CS')
          .map((c) => c.currentProcessPid!);

        // Check if current process should be preempted or yield
        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
          const current = processes.find((p) => p.pid === core.currentProcessPid)!;
          const currentPrio = current.priority ?? 2;

          // If low priority running, check if high priority arrived
          if (
            currentPrio > 1 &&
            q1.filter((p) => !currentlyRunningPids.includes(p.pid)).length > 0
          ) {
            logDecision(
              systemTime,
              core.id,
              `Preempting ${current.pid}`,
              `Higher priority process arrived in Q1`,
              []
            );
            core.currentProcessPid = undefined;
          } else if (currentPrio === 1 && core.rrQuantumProgress >= quantum) {
            logDecision(
              systemTime,
              core.id,
              `Quantum expired for ${current.pid}`,
              `RR Quantum (${quantum}) reached. Moving to back of Q1.`,
              []
            );
            q1.shift();
            q1.push(current);
            core.rrQuantumProgress = 0;
            core.currentProcessPid = undefined;
          }
        }

        if (!core.currentProcessPid) {
          const currentlyRunning = cores
            .filter((c) => c.currentProcessPid && c.currentProcessPid !== 'CS')
            .map((c) => c.currentProcessPid!);
          const availableQ1 = q1.filter((p) => !currentlyRunning.includes(p.pid));
          const availableQ2 = q2.filter((p) => !currentlyRunning.includes(p.pid));

          let selected: MQProcess | undefined;
          if (availableQ1.length > 0) {
            selected = availableQ1[0];
            core.rrQuantumProgress = 0;
            logDecision(
              systemTime,
              core.id,
              `Selected ${selected.pid} from Q1`,
              `Q1 (RR) has highest priority`,
              availableQ1.map((p) => p.pid)
            );
          } else if (availableQ2.length > 0) {
            selected = availableQ2[0];
            logDecision(
              systemTime,
              core.id,
              `Selected ${selected.pid} from Q2`,
              `Q1 is empty, selecting from Q2 (FCFS)`,
              availableQ2.map((p) => p.pid)
            );
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
                const p = processes.find((proc) => proc.pid === c.currentProcessPid)!;
                const timeToComplete = p.remaining;
                const timeToQuantum =
                  (p.priority ?? 2) === 1 ? quantum - c.rrQuantumProgress : Infinity;
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
          const p = processes.find((proc) => proc.pid === core.currentProcessPid)!;
          const lastEvent = events.filter((e) => (e.coreId ?? 0) === core.id).pop();
          if (lastEvent && lastEvent.pid === p.pid && lastEvent.end === systemTime)
            lastEvent.end = nextEventTime;
          else events.push({ pid: p.pid, start: systemTime, end: nextEventTime, coreId: core.id });

          p.remaining -= duration;
          if ((p.priority ?? 2) === 1) core.rrQuantumProgress += duration;
          core.currentTime = nextEventTime;
          core.lastPid = p.pid;

          if (p.remaining <= 0) {
            completedCount++;
            core.currentProcessPid = undefined;
            if ((p.priority ?? 2) === 1) q1.shift();
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

  const metrics = calculateMetrics(events, inputProcesses, options);

  return {
    events,
    metrics,
    snapshots: generateSnapshots(events, inputProcesses, coreCount),
    logs: enableLogging ? logs : undefined,
    stepLogs: enableLogging ? stepLogs : undefined,
  };
}
