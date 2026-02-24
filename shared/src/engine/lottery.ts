import { GanttEvent, Process, SimulationOptions, SimulationResult } from '../types.js';
import { calculateMetrics, generateSnapshots } from './utils.js';

interface LotteryProcess extends Process {
  remaining: number;
  tickets: number;
}

function createSeededRng(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function runLottery(
  inputProcesses: Process[],
  options: SimulationOptions = {}
): SimulationResult {
  const { coreCount = 1, randomSeed = 42 } = options;
  const rng = createSeededRng(randomSeed);

  const processes: LotteryProcess[] = inputProcesses.map((p) => ({
    ...p,
    remaining: p.burst,
    tickets: p.tickets && p.tickets > 0 ? p.tickets : 1,
  }));

  const events: GanttEvent[] = [];
  const total = processes.length;
  let completed = 0;
  let time = 0;

  while (completed < total) {
    const ready = processes
      .filter((p) => p.arrival <= time && p.remaining > 0)
      .sort((a, b) => a.arrival - b.arrival || a.pid.localeCompare(b.pid));

    if (ready.length === 0) {
      const nextArrival = Math.min(
        ...processes.filter((p) => p.remaining > 0).map((p) => p.arrival)
      );
      events.push({ pid: 'IDLE', start: time, end: nextArrival, coreId: 0 });
      time = nextArrival;
      continue;
    }

    const totalTickets = ready.reduce((sum, p) => sum + p.tickets, 0);
    const ticketPick = Math.floor(rng() * totalTickets);
    let cumulative = 0;
    let selected = ready[0];

    for (const candidate of ready) {
      cumulative += candidate.tickets;
      if (ticketPick < cumulative) {
        selected = candidate;
        break;
      }
    }

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
