import { GanttEvent, Metrics, Process, Snapshot, SimulationOptions } from '../types.js';

export function generateSnapshots(
  events: GanttEvent[],
  processes: Process[],
  coreCount: number = 1
): Snapshot[] {
  if (events.length === 0) return [];

  const maxTime = Math.max(...events.map((e) => e.end));
  const snapshots: Snapshot[] = [];

  for (let t = 0; t < maxTime; t++) {
    // 1. Who is running on each core?
    const runningPids: (string | 'IDLE' | 'CS')[] = [];
    for (let c = 0; c < coreCount; c++) {
      // Find event active at time t on core c
      // Note: single-core legacy events might not have coreId set (undefined). Treat as 0.
      const currentEvent = events.find((e) => {
        const eCore = e.coreId ?? 0;
        return eCore === c && t >= e.start && t < e.end;
      });
      runningPids.push(currentEvent ? currentEvent.pid : 'IDLE');
    }

    // 2. Who is ready?
    // Not running on ANY core
    // Arrived
    // Not finished

    // Calculate completion times
    const completionTimes: Record<string, number> = {};
    processes.forEach((p) => {
      const pEvents = events.filter((e) => e.pid === p.pid);
      if (pEvents.length > 0) {
        // Max end time across all events for this process
        completionTimes[p.pid] = Math.max(...pEvents.map((e) => e.end));
      } else {
        completionTimes[p.pid] = -1;
      }
    });

    const readyQueue = processes
      .filter((p) => {
        if (runningPids.includes(p.pid)) return false; // Running on some core
        if (p.arrival > t) return false; // Hasn't arrived
        if (completionTimes[p.pid] <= t && completionTimes[p.pid] !== -1) return false; // Done
        return true;
      })
      .map((p) => p.pid);

    snapshots.push({
      time: t,
      runningPid: runningPids,
      readyQueue,
    });
  }

  // Final snapshot
  snapshots.push({
    time: maxTime,
    runningPid: Array(coreCount).fill('IDLE'),
    readyQueue: [],
  });

  return snapshots;
}

// --- Statistical Helpers ---

function std(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
  const squareDiffs = values.map((v) => Math.pow(v - avg, 2));
  const avgSquareDiff = squareDiffs.reduce((sum, v) => sum + v, 0) / values.length;
  return Math.sqrt(avgSquareDiff);
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

export function calculateMetrics(
  events: GanttEvent[],
  processes: Process[],
  options: SimulationOptions
): Metrics {
  const {
    energyConfig = { activeWatts: 20, idleWatts: 5, switchJoules: 0.1 },
    coreCount = 1,
    contextSwitchOverhead = 0,
  } = options;

  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};
  const responseTimes: Record<string, number> = {};
  const firstRunTimes: Record<string, number> = {};

  // Initialize
  processes.forEach((p) => {
    completionTimes[p.pid] = 0;
    turnaroundTimes[p.pid] = 0;
    waitingTimes[p.pid] = 0;
    responseTimes[p.pid] = 0;
    firstRunTimes[p.pid] = -1;
  });

  // Analyze events
  events.forEach((e) => {
    if (e.pid !== 'IDLE' && e.pid !== 'CS') {
      // Update completion time (will end up being the max end time)
      if (e.end > completionTimes[e.pid]) {
        completionTimes[e.pid] = e.end;
      }
      // First run time
      if (firstRunTimes[e.pid] === -1 || e.start < firstRunTimes[e.pid]) {
        firstRunTimes[e.pid] = e.start;
      }
    }
  });

  // Calculate per-process metrics
  processes.forEach((p) => {
    if (completionTimes[p.pid] > 0) {
      turnaroundTimes[p.pid] = completionTimes[p.pid] - p.arrival;
      waitingTimes[p.pid] = turnaroundTimes[p.pid] - p.burst;
      // Response Time: Time from arrival until first execution start
      if (firstRunTimes[p.pid] !== -1) {
        responseTimes[p.pid] = firstRunTimes[p.pid] - p.arrival;
      } else {
        responseTimes[p.pid] = 0; // Did not run
      }
    }
  });

  // Aggregates
  const turnaroundValues = Object.values(turnaroundTimes);
  const waitingValues = Object.values(waitingTimes);
  const responseValues = Object.values(responseTimes);

  const totalProcesses = processes.length;
  const avgTurnaround =
    totalProcesses > 0 ? turnaroundValues.reduce((a, b) => a + b, 0) / totalProcesses : 0;
  const avgWaiting =
    totalProcesses > 0 ? waitingValues.reduce((a, b) => a + b, 0) / totalProcesses : 0;
  const avgResponse =
    totalProcesses > 0 ? responseValues.reduce((a, b) => a + b, 0) / totalProcesses : 0;

  // Context Switches
  let contextSwitches = 0;
  if (contextSwitchOverhead > 0) {
    contextSwitches = events.filter((e) => e.pid === 'CS').length;
  } else {
    // Count implicit switches if no overhead blocks
    for (let c = 0; c < coreCount; c++) {
      const coreEvents = events
        .filter((e) => (e.coreId ?? 0) === c)
        .sort((a, b) => a.start - b.start);
      for (let i = 0; i < coreEvents.length - 1; i++) {
        const curr = coreEvents[i];
        const next = coreEvents[i + 1];
        if (curr.pid !== next.pid && curr.pid !== 'IDLE' && next.pid !== 'IDLE') {
          contextSwitches++;
        }
      }
    }
  }

  // Energy & Utilization
  const globalMaxTime = events.length > 0 ? Math.max(...events.map((e) => e.end)) : 0;

  // Refined Active Time: Sum of durations of all non-IDLE events across all cores
  let refinedActiveTime = 0;
  events.forEach((e) => {
    if (e.pid !== 'IDLE') refinedActiveTime += e.end - e.start;
  });

  const totalCapacity = globalMaxTime > 0 ? globalMaxTime * coreCount : 1;
  const cpuUtilization = (refinedActiveTime / totalCapacity) * 100;

  const refinedIdleTime = totalCapacity - refinedActiveTime;

  const totalEnergy =
    refinedActiveTime * energyConfig.activeWatts +
    refinedIdleTime * energyConfig.idleWatts +
    contextSwitches * energyConfig.switchJoules;

  return {
    completion: completionTimes,
    turnaround: turnaroundTimes,
    waiting: waitingTimes,
    response: responseTimes,
    avgTurnaround,
    avgWaiting,
    avgResponse,
    p95Turnaround: percentile(turnaroundValues, 95),
    p95Waiting: percentile(waitingValues, 95),
    p95Response: percentile(responseValues, 95),
    stdDevTurnaround: std(turnaroundValues),
    stdDevWaiting: std(waitingValues),
    stdDevResponse: std(responseValues),
    contextSwitches,
    cpuUtilization,
    energy: {
      totalEnergy,
      activeEnergy: refinedActiveTime * energyConfig.activeWatts,
      idleEnergy: refinedIdleTime * energyConfig.idleWatts,
      switchEnergy: contextSwitches * energyConfig.switchJoules,
    },
  };
}
