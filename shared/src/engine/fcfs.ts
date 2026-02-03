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

  // 1. Sort by arrival time (FCFS rule)
  const processes = [...inputProcesses].sort((a, b) => a.arrival - b.arrival);

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

  while (completedCount < totalProcesses) {
    // 1. Find earliest time something happens
    // Next arrival?
    const nextArrival = pIndex < totalProcesses ? processes[pIndex].arrival : Infinity;

    // Sort cores by free time
    cores.sort((a, b) => a.currentTime - b.currentTime);

    // Determine the available core
    // Standard: Pick the earliest free core (cores[0])
    // Affinity: If the *next* process to be scheduled has an affinity for a core that is ALSO free at the same minimal time (or close?), prefer it.
    // However, FCFS strictly schedules the head of the queue.
    // So we look at readyQueue[0].

    let availableCore = cores[0];

    if (enableAffinity && readyQueue.length > 0) {
      const nextProcess = readyQueue[0];
      const lastCoreId = processCoreMap[nextProcess.pid];

      if (lastCoreId !== undefined) {
        // Check if this preferred core is also free at the minimal time (or reasonably close? For now, strict minimal time to avoid inserting IDLE gaps unnecessarily)
        // Actually, if we wait for affinity, we might insert IDLE.
        // Let's implement strict affinity: If preferred core is available at <= cores[0].currentTime, take it.
        // But cores are sorted. So cores[0] is min time.
        // We only check if the preferred core has same currentTime as cores[0].

        const preferredCore = cores.find((c) => c.id === lastCoreId);
        if (preferredCore && preferredCore.currentTime === availableCore.currentTime) {
          availableCore = preferredCore;
        }
      }
    }

    // If ready queue is empty, we must jump to next arrival
    if (readyQueue.length === 0) {
      if (pIndex < totalProcesses) {
        const timeToJump = Math.max(availableCore.currentTime, nextArrival);

        // Record IDLE if jump > current
        if (timeToJump > availableCore.currentTime) {
          log(`Core ${availableCore.id}: IDLE from ${availableCore.currentTime} to ${timeToJump}`);
          logDecision(
            availableCore.currentTime,
            availableCore.id,
            `IDLE until ${timeToJump}`,
            `No process available in ready queue. Next arrival at ${nextArrival}.`,
            []
          );
          events.push({
            pid: 'IDLE',
            start: availableCore.currentTime,
            end: timeToJump,
            coreId: availableCore.id,
          });
          availableCore.currentTime = timeToJump;
          availableCore.lastPid = 'IDLE';
        }

        // Add all arrivals at this new time
        while (pIndex < totalProcesses && processes[pIndex].arrival <= availableCore.currentTime) {
          readyQueue.push(processes[pIndex]);
          pIndex++;
        }
        // Continue loop to pick up from readyQueue
        continue;
      } else {
        break;
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

    const start = c.currentTime;
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
    while (pIndex < totalProcesses && processes[pIndex].arrival <= c.currentTime) {
      readyQueue.push(processes[pIndex]);
      pIndex++;
    }
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
