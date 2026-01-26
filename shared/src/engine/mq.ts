import {
  GanttEvent,
  Metrics,
  Process,
  SimulationResult,
  SimulationOptions,
  DecisionLog,
} from '../types.js';
import { generateSnapshots } from './utils.js';

/**
 * Multilevel Queue (MQ)
 *
 * Static configuration for this implementation:
 * - Queue 1 (High Priority): Priority === 1. Algorithm: Round Robin (RR).
 * - Queue 2 (Low Priority): Priority > 1. Algorithm: FCFS.
 *
 * Scheduling Rule:
 * - Queue 1 has absolute priority over Queue 2.
 * - Queue 2 processes only run if Queue 1 is empty.
 * - Preemptive: If a process arrives in Queue 1 while Queue 2 is running, Queue 2 is preempted.
 */
export function runMQ(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const { contextSwitchOverhead = 0, quantum = 2, enableLogging = false } = options;
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

  // 1. Setup working copy
  const processes = inputProcesses.map((p) => ({
    ...p,
    remaining: p.burst,
  }));

  // Sort by arrival initially
  processes.sort((a, b) => a.arrival - b.arrival);

  let currentTime = 0;
  let completedCount = 0;
  const totalProcesses = processes.length;
  const events: GanttEvent[] = [];

  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};

  const q1: Process[] = []; // RR (Priority === 1)
  const q2: Process[] = []; // FCFS (Priority > 1)

  let pIndex = 0;
  let lastPid: string | 'IDLE' | 'CS' = 'IDLE';

  // RR State
  let currentRRQuantum = 0;

  while (completedCount < totalProcesses) {
    // 1. Enqueue Arrivals
    while (pIndex < totalProcesses && processes[pIndex].arrival <= currentTime) {
      const p = processes[pIndex];
      if (p.priority === 1) {
        log(`Time ${currentTime}: Process ${p.pid} arrived -> Queue 1 (High/RR)`);
        q1.push(p);
      } else {
        log(`Time ${currentTime}: Process ${p.pid} arrived -> Queue 2 (Low/FCFS)`);
        q2.push(p);
      }
      pIndex++;
    }

    // 2. Scheduler Logic
    let currentProcess: Process | undefined;
    let selectedQueue = '';

    // Check Queue 1 (RR)
    if (q1.length > 0) {
      currentProcess = q1[0];
      selectedQueue = 'Q1 (RR)';
    }
    // Check Queue 2 (FCFS) only if Q1 empty
    else if (q2.length > 0) {
      currentProcess = q2[0];
      selectedQueue = 'Q2 (FCFS)';
    }

    // 3. Handle IDLE
    if (!currentProcess) {
      // Find next arrival
      if (pIndex < totalProcesses) {
        const nextArrival = processes[pIndex].arrival;
        logDecision(
          currentTime,
          0,
          'IDLE',
          `Both queues empty. Waiting for next arrival at ${nextArrival}.`,
          []
        );
        events.push({ pid: 'IDLE', start: currentTime, end: nextArrival });
        currentTime = nextArrival;
        lastPid = 'IDLE';
        continue;
      } else {
        break; // All done
      }
    }

    // 4. Logging & Decision
    const q1State = q1.map((p) => `${p.pid}(${p.remaining})`);
    const q2State = q2.map((p) => `${p.pid}(${p.remaining})`);

    logDecision(
      currentTime,
      0,
      `Selected ${currentProcess.pid} from ${selectedQueue}`,
      selectedQueue === 'Q1 (RR)'
        ? `High priority queue has processes. RR Quantum progress: ${currentRRQuantum}/${quantum}`
        : `High priority queue empty. Running Low priority FCFS.`,
      [`Q1: ${q1State.join(', ')}`, `Q2: ${q2State.join(', ')}`]
    );

    // 5. Context Switch
    // Logic: If switching process (even within RR) or switching queues
    // Note: In RR, if we pick the same process, we don't switch unless quantum expired previously (handled by rotating logic below)

    if (
      contextSwitchOverhead > 0 &&
      lastPid !== 'IDLE' &&
      lastPid !== currentProcess.pid &&
      lastPid !== 'CS'
    ) {
      // CS
      events.push({ pid: 'CS', start: currentTime, end: currentTime + contextSwitchOverhead });
      currentTime += contextSwitchOverhead;
      // Reset RR quantum if we switched processes (implicit in logic, but good to be explicit)
      currentRRQuantum = 0;

      // IMPORTANT: Re-check arrivals after CS
      while (pIndex < totalProcesses && processes[pIndex].arrival <= currentTime) {
        const p = processes[pIndex];
        if (p.priority === 1) q1.push(p);
        else q2.push(p);
        pIndex++;
      }

      // Re-evaluate scheduler?
      // If a Q1 process arrived during CS for a Q2 process, we should switch immediately.
      // For simplicity in this step-based simulation, we continue with the *originally selected* process
      // for at least 1 tick or handle it in next iteration.
      // Let's proceed to execute 1 tick.
    }

    // 6. Execution (1 Tick for granular control)
    const runTime = 1;

    // Create/Extend Event
    const lastEvent = events[events.length - 1];
    if (lastEvent && lastEvent.pid === currentProcess.pid) {
      lastEvent.end += runTime;
    } else {
      events.push({
        pid: currentProcess.pid,
        start: currentTime,
        end: currentTime + runTime,
      });
    }

    if (currentProcess.remaining !== undefined) {
      currentProcess.remaining -= runTime;
    }
    currentTime += runTime;
    lastPid = currentProcess.pid;

    // RR Logic Update
    if (selectedQueue === 'Q1 (RR)') {
      currentRRQuantum += runTime;
    } else {
      // If running Q2, reset RR counter just in case
      currentRRQuantum = 0;
    }

    // 7. Check Completion or Quantum Expiry
    if (currentProcess.remaining !== undefined && currentProcess.remaining <= 0) {
      log(`Time ${currentTime}: ${currentProcess.pid} completed`);
      completedCount++;
      const completion = currentTime;
      completionTimes[currentProcess.pid] = completion;
      turnaroundTimes[currentProcess.pid] = completion - currentProcess.arrival;
      waitingTimes[currentProcess.pid] = turnaroundTimes[currentProcess.pid] - currentProcess.burst;

      // Remove from queue
      if (selectedQueue === 'Q1 (RR)') q1.shift();
      else q2.shift();

      // Reset Quantum
      currentRRQuantum = 0;
    } else {
      // Process still running.

      // If it was Q1, check Quantum
      if (selectedQueue === 'Q1 (RR)') {
        if (currentRRQuantum >= quantum) {
          log(`Time ${currentTime}: ${currentProcess.pid} quantum expired, moving to back of Q1`);
          // Move to back
          const p = q1.shift();
          if (p) q1.push(p);
          currentRRQuantum = 0;
        }
      }

      // If it was Q2, check Preemption
      else if (selectedQueue === 'Q2 (FCFS)') {
        // Check if any NEW process arrived in Q1 during this tick
        // (Arrivals are checked at top of loop, but we need to know if we should stop this FCFS process)
        // Actually, the loop restarts, and if Q1 has items, it will be picked next iteration.
        // So implicit preemption works here because we only ran 1 tick.
      }
    }
  }

  // Aggregate Metrics
  const totalTurnaround = Object.values(turnaroundTimes).reduce((sum, val) => sum + val, 0);
  const totalWaiting = Object.values(waitingTimes).reduce((sum, val) => sum + val, 0);

  let contextSwitches = 0;
  for (let i = 0; i < events.length - 1; i++) {
    if (
      events[i].pid !== events[i + 1].pid &&
      events[i].pid !== 'IDLE' &&
      events[i + 1].pid !== 'IDLE'
    ) {
      contextSwitches++;
    }
  }

  // Calculate Active Time
  let activeTime = 0;
  let idleTime = 0;
  events.forEach((e) => {
    const duration = e.end - e.start;
    if (e.pid === 'IDLE') idleTime += duration;
    else if (e.pid !== 'CS') activeTime += duration;
  });

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
      totalEnergy: activeTime * 20 + idleTime * 5 + contextSwitches * 0.1,
      activeEnergy: activeTime * 20,
      idleEnergy: idleTime * 5,
      switchEnergy: contextSwitches * 0.1,
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
