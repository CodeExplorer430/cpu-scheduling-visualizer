import { Algorithm, GanttEvent, Metrics, Process, SimulationResult, Snapshot } from '../types.js';

export function runFCFS(inputProcesses: Process[]): SimulationResult {
  // 1. Sort by arrival time (FCFS rule)
  // Create a shallow copy to avoid mutating the input array
  const processes = [...inputProcesses].sort((a, b) => a.arrival - b.arrival);

  let currentTime = 0;
  const events: GanttEvent[] = [];
  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};

  processes.forEach(process => {
    const { pid, arrival, burst } = process;

    // Handle Idle time if necessary
    if (currentTime < arrival) {
      events.push({
        pid: 'IDLE',
        start: currentTime,
        end: arrival
      });
      currentTime = arrival;
    }

    const start = currentTime;
    const end = start + burst;

    // Execution event
    events.push({
      pid,
      start,
      end
    });

    // Update time
    currentTime = end;

    // Metrics
    const completion = end;
    const turnaround = completion - arrival;
    const waiting = turnaround - burst;

    completionTimes[pid] = completion;
    turnaroundTimes[pid] = turnaround;
    waitingTimes[pid] = waiting;
  });

  // Aggregate metrics
  const totalTurnaround = Object.values(turnaroundTimes).reduce((sum, val) => sum + val, 0);
  const totalWaiting = Object.values(waitingTimes).reduce((sum, val) => sum + val, 0);
  
  const count = processes.length;
  const snapshots: Snapshot[] = [];
  
  // Generate snapshots based on events
  if (events.length > 0) {
    const totalDuration = events[events.length - 1].end;
    for (let t = 0; t < totalDuration; t++) {
      const event = events.find(e => t >= e.start && t < e.end);
      // Ready queue in FCFS: all processes that have arrived but haven't started yet
      // This is a bit simplified for FCFS snapshots
      const arrivedNotStarted = processes.filter(p => p.arrival <= t && completionTimes[p.pid] > t && (event?.pid !== p.pid));
      
      snapshots.push({
        time: t,
        runningPid: event?.pid || 'IDLE',
        readyQueue: arrivedNotStarted.map(p => p.pid)
      });
    }
    // Add final snapshot
    snapshots.push({
      time: totalDuration,
      runningPid: 'IDLE',
      readyQueue: []
    });
  }

  const metrics: Metrics = {
    completion: completionTimes,
    turnaround: turnaroundTimes,
    waiting: waitingTimes,
    avgTurnaround: count > 0 ? totalTurnaround / count : 0,
    avgWaiting: count > 0 ? totalWaiting / count : 0,
    contextSwitches: 0
  };

  return { events, metrics, snapshots };
}
