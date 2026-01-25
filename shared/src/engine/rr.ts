import { GanttEvent, Metrics, Process, SimulationResult, SimulationOptions, DecisionLog } from '../types.js';
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

  const { quantum = 2, contextSwitchOverhead = 0, enableLogging = false } = options;
  const logs: string[] = [];
  const stepLogs: DecisionLog[] = [];

  const log = (msg: string) => {
    if (enableLogging) logs.push(msg);
  };

  const logDecision = (time: number, coreId: number, message: string, reason: string, queueState: string[]) => {
    if (enableLogging) stepLogs.push({ time, coreId, message, reason, queueState });
  };

  // Deep copy + add remaining burst
  const processes: ProcessWithRemaining[] = inputProcesses.map((p) => ({
    ...p,
    remaining: p.burst,
  }));

  // Sort by arrival initially
  const sortedByArrival = [...processes].sort((a, b) => a.arrival - b.arrival);

  let currentTime = 0;
  let completedCount = 0;
  const totalProcesses = processes.length;
  const events: GanttEvent[] = [];

  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};

  const readyQueue: ProcessWithRemaining[] = [];
  let arrivalIndex = 0;
  let lastPid: string | 'IDLE' | 'CS' = 'IDLE';

  // Helper to enqueue newly arrived processes
  const enqueueArrivals = (time: number) => {
    while (arrivalIndex < totalProcesses && sortedByArrival[arrivalIndex].arrival <= time) {
      const p = sortedByArrival[arrivalIndex];
      readyQueue.push(p);
      log(`Time ${time}: Process ${p.pid} arrived and queued`);
      arrivalIndex++;
    }
  };

  // Initial fill
  enqueueArrivals(currentTime);

  while (completedCount < totalProcesses) {
    if (readyQueue.length === 0) {
      if (arrivalIndex < totalProcesses) {
        const nextArrival = sortedByArrival[arrivalIndex].arrival;
        log(`Time ${currentTime}: System IDLE until ${nextArrival}`);
        logDecision(currentTime, 0, `IDLE until ${nextArrival}`, `Ready queue empty. Waiting for next arrival.`, []);

        events.push({
          pid: 'IDLE',
          start: currentTime,
          end: nextArrival,
        });
        currentTime = nextArrival;
        lastPid = 'IDLE';
        enqueueArrivals(currentTime);
      }
      continue;
    }

    const queueState = readyQueue.map(p => `${p.pid}(Rem:${p.remaining})`);
    const currentProcess = readyQueue.shift()!;

    logDecision(
        currentTime,
        0,
        `Selected ${currentProcess.pid}`,
        `Selected ${currentProcess.pid} from head of queue. Quantum: ${quantum}.`,
        queueState
    );

    // Context Switch Overhead
    // We switch if the new process is different from the last one
    // AND the last one wasn't IDLE (unless we treat IDLE->Process as switch, usually we don't count overhead there, but maybe?)
    // Usually overhead is "saving old state, loading new state".
    // From IDLE means no old state to save (maybe).
    // Let's stick to: if lastPid != IDLE && lastPid != current.pid -> Overhead.
    if (
      contextSwitchOverhead > 0 &&
      lastPid !== 'IDLE' &&
      lastPid !== currentProcess.pid &&
      lastPid !== 'CS'
    ) {
      log(`Time ${currentTime}: Context Switch from ${lastPid} to ${currentProcess.pid}`);
      events.push({
        pid: 'CS',
        start: currentTime,
        end: currentTime + contextSwitchOverhead,
      });
      currentTime += contextSwitchOverhead;

      // Arrivals might happen DURING context switch?
      // Let's assume queue is frozen during switch or arrivals can happen.
      // For simplicity, check arrivals after switch time.
      enqueueArrivals(currentTime);
    }

    // Determine run time
    const runTime = Math.min(currentProcess.remaining, quantum);
    log(`Time ${currentTime}: ${currentProcess.pid} runs for ${runTime}ms (Quantum: ${quantum})`);

    // In Round Robin, we avoid merging events even for the same PID 
    // to allow the user to see the quantum-based preemption steps.
    events.push({
      pid: currentProcess.pid,
      start: currentTime,
      end: currentTime + runTime,
    });

    currentTime += runTime;
    currentProcess.remaining -= runTime;
    lastPid = currentProcess.pid;

    // Check for new arrivals BEFORE re-queueing
    enqueueArrivals(currentTime);

    if (currentProcess.remaining > 0) {
      log(`Time ${currentTime}: ${currentProcess.pid} time slice expired, re-queuing`);
      readyQueue.push(currentProcess);
    } else {
      // Completed
      log(`Time ${currentTime}: ${currentProcess.pid} completed`);
      completedCount++;
      const completion = currentTime;
      completionTimes[currentProcess.pid] = completion;
      turnaroundTimes[currentProcess.pid] = completion - currentProcess.arrival;
      waitingTimes[currentProcess.pid] = turnaroundTimes[currentProcess.pid] - currentProcess.burst;
    }
  }

  // Aggregate Metrics
  const totalTurnaround = Object.values(turnaroundTimes).reduce((sum, val) => sum + val, 0);
  const totalWaiting = Object.values(waitingTimes).reduce((sum, val) => sum + val, 0);

  // Count context switches
  let contextSwitches = 0;
  if (contextSwitchOverhead > 0) {
    contextSwitches = events.filter((e) => e.pid === 'CS').length;
  } else {
    for (let i = 0; i < events.length - 1; i++) {
      if (
        events[i].pid !== events[i + 1].pid &&
        events[i].pid !== 'IDLE' &&
        events[i + 1].pid !== 'IDLE'
      ) {
        contextSwitches++;
      }
    }
  }

  // Calculate Active Time for Energy & Utilization
  let activeTime = 0;
  let idleTime = 0;
  events.forEach((e) => {
    const duration = e.end - e.start;
    if (e.pid === 'IDLE') idleTime += duration;
    else if (e.pid !== 'CS') activeTime += duration;
  });

  const totalEnergy =
    activeTime * (options.energyConfig?.activeWatts ?? 20) +
    idleTime * (options.energyConfig?.idleWatts ?? 5) +
    contextSwitches * (options.energyConfig?.switchJoules ?? 0.1);
  const totalTime = events.length > 0 ? events[events.length - 1].end : 1;
  const cpuUtilization = (activeTime / totalTime) * 100;

  const metrics: Metrics = {
    completion: completionTimes,
    turnaround: turnaroundTimes,
    waiting: waitingTimes,
    avgTurnaround: totalProcesses > 0 ? totalTurnaround / totalProcesses : 0,
    avgWaiting: totalProcesses > 0 ? totalWaiting / totalProcesses : 0,
    contextSwitches,
    cpuUtilization,
    energy: {
      totalEnergy,
      activeEnergy: activeTime * (options.energyConfig?.activeWatts ?? 20),
      idleEnergy: idleTime * (options.energyConfig?.idleWatts ?? 5),
      switchEnergy: contextSwitches * (options.energyConfig?.switchJoules ?? 0.1),
    },
  };

  return {
    events,
    metrics,
    snapshots: generateSnapshots(events, inputProcesses),
    logs: enableLogging ? logs : undefined,
    stepLogs: enableLogging ? stepLogs : undefined,
  };
}
