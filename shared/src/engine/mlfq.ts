import { GanttEvent, Metrics, Process, SimulationResult, SimulationOptions, DecisionLog } from '../types.js';
import { generateSnapshots } from './utils.js';

interface MLFQProcess extends Process {
  currentQueue: number; // 0 (High), 1 (Medium), 2 (Low)
  timeInCurrentQuantum: number;
}

/**
 * MLFQ (Multilevel Feedback Queue)
 * 
 * Rules:
 * 1. Three Queues:
 *    - Q0 (High Priority): RR, Quantum = 2
 *    - Q1 (Medium Priority): RR, Quantum = 4
 *    - Q2 (Low Priority): FCFS
 * 2. All incoming processes enter Q0.
 * 3. If a process uses its entire quantum in Q0, it is demoted to Q1.
 * 4. If a process uses its entire quantum in Q1, it is demoted to Q2.
 * 5. Q2 runs only if Q0 and Q1 are empty.
 */
export function runMLFQ(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const { contextSwitchOverhead = 0, enableLogging = false } = options;
  const logs: string[] = [];
  const stepLogs: DecisionLog[] = [];

  const log = (msg: string) => {
    if (enableLogging) logs.push(msg);
  };

  const logDecision = (time: number, coreId: number, message: string, reason: string, queueState: string[]) => {
    if (enableLogging) stepLogs.push({ time, coreId, message, reason, queueState });
  };

  // 1. Setup working copy
  // All start in Queue 0
  const processes: MLFQProcess[] = inputProcesses.map((p) => ({
    ...p,
    remaining: p.burst,
    currentQueue: 0,
    timeInCurrentQuantum: 0,
  }));

  // Sort by arrival
  processes.sort((a, b) => a.arrival - b.arrival);

  let currentTime = 0;
  let completedCount = 0;
  const totalProcesses = processes.length;
  const events: GanttEvent[] = [];

  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};

  // Three Queues
  const queues: MLFQProcess[][] = [[], [], []];
  const quantums = [2, 4, Infinity]; // Q0=2, Q1=4, Q2=FCFS (Infinity)

  let pIndex = 0;
  let lastPid: string | 'IDLE' | 'CS' = 'IDLE';

  while (completedCount < totalProcesses) {
    // 1. Enqueue Arrivals
    while (pIndex < totalProcesses && processes[pIndex].arrival <= currentTime) {
      const p = processes[pIndex];
      log(`Time ${currentTime}: Process ${p.pid} arrived -> Queue 0`);
      queues[0].push(p);
      pIndex++;
    }

    // 2. Select Queue and Process
    let currentProcess: MLFQProcess | undefined;
    let selectedQueueIdx = -1;

    for (let i = 0; i < 3; i++) {
      if (queues[i].length > 0) {
        currentProcess = queues[i][0];
        selectedQueueIdx = i;
        break;
      }
    }

    // 3. Handle IDLE
    if (!currentProcess) {
       if (pIndex < totalProcesses) {
         const nextArrival = processes[pIndex].arrival;
         logDecision(currentTime, 0, 'IDLE', `All queues empty. Waiting for next arrival.`, []);
         events.push({ pid: 'IDLE', start: currentTime, end: nextArrival });
         currentTime = nextArrival;
         lastPid = 'IDLE';
         continue;
       } else {
         break;
       }
    }

    // 4. Logging
    const qStates = queues.map((q, i) => `Q${i}: ` + q.map(p => `${p.pid}(${p.remaining})`).join(', '));
    logDecision(
      currentTime,
      0,
      `Selected ${currentProcess.pid} from Q${selectedQueueIdx}`,
      `Highest priority non-empty queue is Q${selectedQueueIdx}.`,
      qStates
    );

    // 5. Context Switch
    if (
        contextSwitchOverhead > 0 &&
        lastPid !== 'IDLE' &&
        lastPid !== currentProcess.pid &&
        lastPid !== 'CS'
    ) {
        events.push({ pid: 'CS', start: currentTime, end: currentTime + contextSwitchOverhead });
        currentTime += contextSwitchOverhead;
        
        // Check arrivals during CS
        while (pIndex < totalProcesses && processes[pIndex].arrival <= currentTime) {
            const p = processes[pIndex];
            queues[0].push(p);
            pIndex++;
        }
        
        // MLFQ logic: If a new process arrived in Q0 during CS, and we were about to run Q1/Q2,
        // we should ideally switch.
        // For simplicity, we proceed 1 tick with the originally selected process.
    }

    // 6. Execute 1 Tick
    const runTime = 1;

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
    currentProcess.timeInCurrentQuantum += runTime;
    currentTime += runTime;
    lastPid = currentProcess.pid;

    // 7. Check Completion or Demotion
    const quantum = quantums[selectedQueueIdx];

    if (currentProcess.remaining !== undefined && currentProcess.remaining <= 0) {
        log(`Time ${currentTime}: ${currentProcess.pid} completed`);
        completedCount++;
        const completion = currentTime;
        completionTimes[currentProcess.pid] = completion;
        turnaroundTimes[currentProcess.pid] = completion - currentProcess.arrival;
        waitingTimes[currentProcess.pid] = turnaroundTimes[currentProcess.pid] - currentProcess.burst;

        // Remove from queue
        queues[selectedQueueIdx].shift();

    } else if (currentProcess.timeInCurrentQuantum >= quantum) {
        // Quantum Expired -> Demote
        log(`Time ${currentTime}: ${currentProcess.pid} quantum expired. Demoting from Q${selectedQueueIdx} to Q${Math.min(2, selectedQueueIdx + 1)}`);
        
        // Remove from current
        queues[selectedQueueIdx].shift();
        
        // Reset Quantum Counter
        currentProcess.timeInCurrentQuantum = 0;
        
        // Demote (if possible)
        const nextQueueIdx = Math.min(2, selectedQueueIdx + 1);
        currentProcess.currentQueue = nextQueueIdx;
        
        // Add to new queue
        queues[nextQueueIdx].push(currentProcess);
    } 
    // Implicit preemption case for next iteration:
    // If we are in Q1/Q2 and a new process arrives in Q0, next loop will pick from Q0.
  }

  // Aggregate Metrics
  const totalTurnaround = Object.values(turnaroundTimes).reduce((sum, val) => sum + val, 0);
  const totalWaiting = Object.values(waitingTimes).reduce((sum, val) => sum + val, 0);

  let contextSwitches = 0;
  for (let i = 0; i < events.length - 1; i++) {
    if (events[i].pid !== events[i + 1].pid && events[i].pid !== 'IDLE' && events[i + 1].pid !== 'IDLE') {
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
