import { GanttEvent, Process, SimulationOptions, SimulationResult } from '../types.js';
import { calculateMetrics, generateSnapshots } from './utils.js';

interface RMSProcess extends Process {
  remaining: number;
  effectivePeriod: number;
}

export function runRMS(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const { coreCount = 1 } = options;

  const processes: RMSProcess[] = inputProcesses.map((p) => ({
    ...p,
    remaining: p.burst,
    effectivePeriod: p.period && p.period > 0 ? p.period : p.burst,
  }));

  const events: GanttEvent[] = [];
  let time = 0;
  let completed = 0;

  while (completed < processes.length) {
    const ready = processes
      .filter((p) => p.arrival <= time && p.remaining > 0)
      .sort((a, b) => {
        if (a.effectivePeriod !== b.effectivePeriod) {
          return a.effectivePeriod - b.effectivePeriod;
        }
        if (a.arrival !== b.arrival) return a.arrival - b.arrival;
        return a.pid.localeCompare(b.pid);
      });

    if (ready.length === 0) {
      const nextArrival = Math.min(
        ...processes.filter((p) => p.remaining > 0).map((p) => p.arrival)
      );
      events.push({ pid: 'IDLE', start: time, end: nextArrival, coreId: 0 });
      time = nextArrival;
      continue;
    }

    const selected = ready[0];
    const lastEvent = events[events.length - 1];

    if (lastEvent && lastEvent.pid === selected.pid && lastEvent.end === time) {
      lastEvent.end += 1;
    } else {
      events.push({ pid: selected.pid, start: time, end: time + 1, coreId: 0 });
    }

    selected.remaining -= 1;
    if (selected.remaining === 0) {
      completed++;
    }
    time += 1;
  }

  return {
    events,
    metrics: calculateMetrics(events, inputProcesses, options),
    snapshots: generateSnapshots(events, inputProcesses, coreCount),
  };
}
