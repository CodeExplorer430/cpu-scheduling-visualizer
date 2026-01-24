import { GanttEvent, Metrics, Process, SimulationResult, SimulationOptions } from '../types.js';
import { generateSnapshots } from './utils.js';

export function runFCFS(inputProcesses: Process[], options: SimulationOptions = {}): SimulationResult {
  const { contextSwitchOverhead = 0, enableLogging = false } = options;
  const logs: string[] = [];
  const log = (msg: string) => { if (enableLogging) logs.push(msg); };

  // 1. Sort by arrival time (FCFS rule)
  const processes = [...inputProcesses].sort((a, b) => a.arrival - b.arrival);

  let currentTime = 0;
  const events: GanttEvent[] = [];
  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};

  let lastPid: string | 'IDLE' | 'CS' = 'IDLE';

  processes.forEach(process => {
    const { pid, arrival, burst } = process;

    // Handle Idle time if necessary
    if (currentTime < arrival) {
      log(`Time ${currentTime}: System IDLE until ${arrival}`);
      events.push({
        pid: 'IDLE',
        start: currentTime,
        end: arrival
      });
      currentTime = arrival;
      lastPid = 'IDLE';
    }

    // Context Switch Overhead
    if (contextSwitchOverhead > 0 && lastPid !== 'IDLE' && lastPid !== pid) {
      log(`Time ${currentTime}: Context Switch from ${lastPid} to ${pid} (${contextSwitchOverhead}ms)`);
      events.push({
        pid: 'CS',
        start: currentTime,
        end: currentTime + contextSwitchOverhead
      });
      currentTime += contextSwitchOverhead;
    }

    const start = currentTime;
    const end = start + burst;

    // Execution event
    log(`Time ${currentTime}: Process ${pid} starts execution`);
    events.push({
      pid,
      start,
      end
    });

    // Update time
    currentTime = end;
    lastPid = pid;
    log(`Time ${currentTime}: Process ${pid} completed`);

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
  
  // Calculate context switches from events
  let contextSwitches = 0;
  for(let i=0; i<events.length-1; i++) {
    if (events[i].pid !== events[i+1].pid && events[i].pid !== 'IDLE' && events[i+1].pid !== 'IDLE' && events[i].pid !== 'CS' && events[i+1].pid !== 'CS') {
        contextSwitches++;
    }
    // Note: If we explicitly insert CS events, counting them is easy: count 'CS' events.
    // Or stick to the logic: switch between PIDs.
    // If CS events exist, the transition P1 -> CS -> P2 is ONE switch.
  }
  
  // Simple count of CS blocks if overhead > 0, otherwise standard logic
  if (contextSwitchOverhead > 0) {
      contextSwitches = events.filter(e => e.pid === 'CS').length;
  } else {
      // Standard counting for 0 overhead
      for (let i = 0; i < events.length - 1; i++) {
        if (events[i].pid !== events[i+1].pid && events[i].pid !== 'IDLE' && events[i+1].pid !== 'IDLE') {
          contextSwitches++;
        }
      }
  }

  const metrics: Metrics = {
    completion: completionTimes,
    turnaround: turnaroundTimes,
    waiting: waitingTimes,
    avgTurnaround: count > 0 ? totalTurnaround / count : 0,
    avgWaiting: count > 0 ? totalWaiting / count : 0,
    contextSwitches 
  };

  return {
    events,
    metrics,
    snapshots: generateSnapshots(events, inputProcesses),
    logs: enableLogging ? logs : undefined
  };
}
