import { Algorithm, GanttEvent, Metrics, Process, SimulationResult } from '../types.js';

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
  const metrics: Metrics = {
    completion: completionTimes,
    turnaround: turnaroundTimes,
    waiting: waitingTimes,
    avgTurnaround: count > 0 ? totalTurnaround / count : 0,
    avgWaiting: count > 0 ? totalWaiting / count : 0,
    contextSwitches: 0 // FCFS typically considered non-preemptive, minimal CS count usually not focused on unless specific rules applied
  };

  return { events, metrics };
}
