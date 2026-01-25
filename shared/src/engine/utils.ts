import { GanttEvent, Process, Snapshot } from '../types.js';

export function generateSnapshots(events: GanttEvent[], processes: Process[], coreCount: number = 1): Snapshot[] {
  if (events.length === 0) return [];

  const maxTime = events[events.length - 1].end;
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
        completionTimes[p.pid] = Math.max(...pEvents.map(e => e.end));
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
