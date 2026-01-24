import { GanttEvent, Process, Snapshot } from '../types.js';

export function generateSnapshots(events: GanttEvent[], processes: Process[]): Snapshot[] {
  if (events.length === 0) return [];

  const maxTime = events[events.length - 1].end;
  const snapshots: Snapshot[] = [];

  for (let t = 0; t < maxTime; t++) {
    // 1. Who is running?
    const currentEvent = events.find((e) => t >= e.start && t < e.end);
    const runningPid = currentEvent ? currentEvent.pid : 'IDLE';

    // 2. Who is ready?
    // Condition:
    // - Arrived by now (arrival <= t)
    // - Not finished yet. We need to know when they finished.
    //   We can deduce "finished" if their total executed time == burst.
    //   OR simpler: We can look at the events.
    //   A process is "Ready" if it is NOT running right now, AND it has work left to do.

    // Let's calculate remaining work for each process at time t?
    // That's expensive.

    // Alternative:
    // A process is in Ready Queue if:
    // a) Arrival <= t
    // b) Completion Time > t (It hasn't finished yet)
    // c) It is not currently running.

    // We need completion times first.
    const completionTimes: Record<string, number> = {};
    processes.forEach((p) => {
      // Find the last event for this pid
      const pEvents = events.filter((e) => e.pid === p.pid);
      if (pEvents.length > 0) {
        completionTimes[p.pid] = pEvents[pEvents.length - 1].end;
      } else {
        completionTimes[p.pid] = -1; // Never ran (shouldn't happen in valid sim)
      }
    });

    const readyQueue = processes
      .filter((p) => {
        if (p.pid === runningPid) return false; // Currently running
        if (p.arrival > t) return false; // Hasn't arrived
        if (completionTimes[p.pid] <= t && completionTimes[p.pid] !== -1) return false; // Already done
        return true;
      })
      .map((p) => p.pid);

    snapshots.push({
      time: t,
      runningPid,
      readyQueue,
    });
  }

  // Final snapshot at maxTime (all done or idle)
  snapshots.push({
    time: maxTime,
    runningPid: 'IDLE',
    readyQueue: [],
  });

  return snapshots;
}
