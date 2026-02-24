import { GanttEvent, Process, SimulationOptions, SimulationResult } from '../types.js';
import { calculateMetrics, generateSnapshots } from './utils.js';

interface FairShareProcess extends Process {
  remaining: number;
  shareGroup: string;
}

export function runFairShare(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const { coreCount = 1, fairShareQuantum = 1 } = options;

  const processes: FairShareProcess[] = inputProcesses.map((p) => ({
    ...p,
    remaining: p.burst,
    shareGroup: p.shareGroup || 'default',
  }));

  const events: GanttEvent[] = [];
  let time = 0;
  let completed = 0;

  const groupUsage: Record<string, number> = {};

  while (completed < processes.length) {
    const ready = processes.filter((p) => p.arrival <= time && p.remaining > 0);

    if (ready.length === 0) {
      const nextArrival = Math.min(
        ...processes.filter((p) => p.remaining > 0).map((p) => p.arrival)
      );
      events.push({ pid: 'IDLE', start: time, end: nextArrival, coreId: 0 });
      time = nextArrival;
      continue;
    }

    const groupWeights: Record<string, number> = {};
    for (const p of ready) {
      const weight = p.shareWeight && p.shareWeight > 0 ? p.shareWeight : 1;
      groupWeights[p.shareGroup] = weight;
      if (groupUsage[p.shareGroup] === undefined) {
        groupUsage[p.shareGroup] = 0;
      }
    }

    const candidateGroups = Object.keys(groupWeights);
    candidateGroups.sort((a, b) => {
      const scoreA = groupUsage[a] / groupWeights[a];
      const scoreB = groupUsage[b] / groupWeights[b];
      if (scoreA !== scoreB) return scoreA - scoreB;
      return a.localeCompare(b);
    });

    const selectedGroup = candidateGroups[0];
    const selectedProcess = ready
      .filter((p) => p.shareGroup === selectedGroup)
      .sort((a, b) => a.arrival - b.arrival || a.pid.localeCompare(b.pid))[0];

    const runTime = Math.min(fairShareQuantum, selectedProcess.remaining);
    const end = time + runTime;
    const lastEvent = events[events.length - 1];

    if (lastEvent && lastEvent.pid === selectedProcess.pid && lastEvent.end === time) {
      lastEvent.end = end;
    } else {
      events.push({ pid: selectedProcess.pid, start: time, end, coreId: 0 });
    }

    selectedProcess.remaining -= runTime;
    groupUsage[selectedGroup] += runTime;
    if (selectedProcess.remaining === 0) {
      completed++;
    }
    time = end;
  }

  return {
    events,
    metrics: calculateMetrics(events, inputProcesses, options),
    snapshots: generateSnapshots(events, inputProcesses, coreCount),
  };
}
