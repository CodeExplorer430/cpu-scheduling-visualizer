import { GanttEvent, Process, SimulationResult, SimulationOptions, DecisionLog } from '../types.js';
import { generateSnapshots, calculateMetrics } from './utils.js';

export function runFCFS(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const {
    contextSwitchOverhead = 0,
    enableLogging = false,
    coreCount = 1,
    enableAffinity = false,
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

  // 1. Sort by arrival time (FCFS rule), preserving input order for ties.
  const processes = inputProcesses
    .map((p, order) => ({ ...p, order }))
    .sort((a, b) => a.arrival - b.arrival || a.order - b.order);

  const events: GanttEvent[] = [];
  const processCoreMap: Record<string, number> = {};

  // Core State
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

  let completedCount = 0;
  const totalProcesses = processes.length;
  let pIndex = 0; // Index in sorted arrival list
  const readyQueue: Process[] = [];

  const enqueueArrivals = (upToTime: number) => {
    while (pIndex < totalProcesses && processes[pIndex].arrival <= upToTime) {
      readyQueue.push(processes[pIndex]);
      pIndex++;
    }
  };

  while (completedCount < totalProcesses) {
    // Pick earliest-free core (deterministic tie-break by core id).
    cores.sort((a, b) => a.currentTime - b.currentTime || a.id - b.id);
    let availableCore = cores[0];

    // Bring in all arrivals visible at this core's current time.
    enqueueArrivals(availableCore.currentTime);

    // If no work is ready, this core idles until next arrival.
    if (readyQueue.length === 0) {
      if (pIndex >= totalProcesses) break;
      const nextArrival = processes[pIndex].arrival;
      if (nextArrival > availableCore.currentTime) {
        log(`Core ${availableCore.id}: IDLE from ${availableCore.currentTime} to ${nextArrival}`);
        logDecision(
          availableCore.currentTime,
          availableCore.id,
          `IDLE until ${nextArrival}`,
          `No process available in ready queue. Next arrival at ${nextArrival}.`,
          []
        );
        events.push({
          pid: 'IDLE',
          start: availableCore.currentTime,
          end: nextArrival,
          coreId: availableCore.id,
        });
        availableCore.currentTime = nextArrival;
        availableCore.lastPid = 'IDLE';
      }
      enqueueArrivals(availableCore.currentTime);
      if (readyQueue.length === 0) continue;
    }

    // Optional strict affinity: only when preferred core is tied for earliest availability.
    if (enableAffinity && readyQueue.length > 0) {
      const nextProcess = readyQueue[0];
      const preferredCoreId = processCoreMap[nextProcess.pid];
      if (preferredCoreId !== undefined) {
        const preferredCore = cores.find((c) => c.id === preferredCoreId);
        if (preferredCore && preferredCore.currentTime === availableCore.currentTime) {
          availableCore = preferredCore;
        }
      }
    }

    // If ready queue has process
    // Capture state before shift
    const currentQueuePids = readyQueue.map((p) => p.pid);
    const process = readyQueue.shift()!;
    const { pid, arrival, burst } = process;

    // Log decision
    logDecision(
      availableCore.currentTime,
      availableCore.id,
      `Selected Process ${pid}`,
      `Selected ${pid} because it arrived earliest (Arrival: ${arrival}). FCFS logic.${enableAffinity && processCoreMap[pid] === availableCore.id ? ' (Affinity)' : ''}`,
      currentQueuePids
    );

    const c = availableCore;

    // Context Switch
    if (
      contextSwitchOverhead > 0 &&
      c.lastPid !== 'IDLE' &&
      c.lastPid !== pid &&
      c.lastPid !== 'CS'
    ) {
      log(`Core ${c.id}: Context Switch ${c.lastPid}->${pid}`);
      events.push({
        pid: 'CS',
        start: c.currentTime,
        end: c.currentTime + contextSwitchOverhead,
        coreId: c.id,
      });
      c.currentTime += contextSwitchOverhead;
    }

    const start = Math.max(c.currentTime, arrival);
    if (start > c.currentTime) {
      events.push({
        pid: 'IDLE',
        start: c.currentTime,
        end: start,
        coreId: c.id,
      });
    }
    const end = start + burst;

    log(`Core ${c.id}: Runs ${pid} (${start}-${end})`);
    events.push({
      pid,
      start,
      end,
      coreId: c.id,
    });

    c.currentTime = end;
    c.lastPid = pid;
    processCoreMap[pid] = c.id; // Record core usage
    completedCount++;

    // Check arrivals up to new time
    enqueueArrivals(c.currentTime);
  }

  events.sort((a, b) => a.start - b.start || a.end - b.end || (a.coreId ?? 0) - (b.coreId ?? 0));

  const metrics = calculateMetrics(events, inputProcesses, options);

  return {
    events,
    metrics,
    snapshots: generateSnapshots(events, inputProcesses, coreCount),
    logs: enableLogging ? logs : undefined,
    stepLogs: enableLogging ? stepLogs : undefined,
  };
}
