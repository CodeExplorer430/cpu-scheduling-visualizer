import { GanttEvent, Metrics, Process, SimulationResult, SimulationOptions } from '../types.js';
import { generateSnapshots } from './utils.js';

export function runFCFS(inputProcesses: Process[], options: SimulationOptions = {}): SimulationResult {
  const { 
    contextSwitchOverhead = 0, 
    enableLogging = false, 
    coreCount = 1,
    energyConfig = { activeWatts: 20, idleWatts: 5, switchJoules: 0.1 } // Defaults
  } = options;
  
  const logs: string[] = [];
  const log = (msg: string) => { if (enableLogging) logs.push(msg); };

  // 1. Sort by arrival time (FCFS rule)
  const processes = [...inputProcesses].sort((a, b) => a.arrival - b.arrival);

  const events: GanttEvent[] = [];
  const completionTimes: Record<string, number> = {};
  const turnaroundTimes: Record<string, number> = {};
  const waitingTimes: Record<string, number> = {};

  // Core State
  interface CoreState {
    id: number;
    currentTime: number;
    lastPid: string | 'IDLE' | 'CS';
  }

  const cores: CoreState[] = Array.from({ length: coreCount }, (_, i) => ({
    id: i,
    currentTime: 0,
    lastPid: 'IDLE'
  }));

  // Global Ready Queue logic
  // Since FCFS is non-preemptive and arrival-based, we can just iterate processes?
  // No, with multi-core, a process arriving later might get picked up by a core that finishes early.
  // We need a simulation loop time-step or event-driven.
  // Event-driven is better. Events: Process Arrival, Core Free.

  // Let's use a simple discrete event simulation approach or just iterate if we can?
  // With FCFS, we just need to assign the next available core to the next process in queue.
  // But processes arrive at specific times.
  
  // We can track `readyQueue`.
  // Loop until all processes done.
  
  let completedCount = 0;
  const totalProcesses = processes.length;
  let pIndex = 0; // Index in sorted arrival list
  const readyQueue: Process[] = [];
  
  // Simulation Clock?
  // We can jump to the next "interesting" time: min(nextArrival, min(coreFreeTime))
  
  while (completedCount < totalProcesses) {
    // 1. Find earliest time something happens
    // Next arrival?
    const nextArrival = pIndex < totalProcesses ? processes[pIndex].arrival : Infinity;
    // Earliest core free?
    const nextCoreFree = Math.min(...cores.map(c => c.currentTime));
    
    // Global time advances to the interesting point
    // Ideally we process events at `nextCoreFree` if it's <= nextArrival, or `nextArrival` if it's earlier.
    // Actually, we can fill cores up to `nextArrival` if they are free.
    
    // Let's sort cores by free time
    cores.sort((a, b) => a.currentTime - b.currentTime);
    const availableCore = cores[0]; // Core that frees up earliest
    
    // If ready queue is empty, we must jump to next arrival
    if (readyQueue.length === 0) {
      if (pIndex < totalProcesses) {
        // Jump time?
        // If the core is free BEFORE next arrival, it idles until next arrival (or until other cores finish?)
        // If it idles, we record IDLE event.
        // Wait, other cores might finish before nextArrival too.
        // The *global* system time isn't single. Each core has its own time.
        
        // We take the earliest free core.
        // If it's free at T_free, and next process arrives at T_arrival.
        // If T_free < T_arrival, this core idles from T_free to T_arrival.
        // BUT, maybe another core frees up at T_free_2 (where T_free < T_free_2 < T_arrival).
        // It also idles.
        // So we can safely advance this core to T_arrival.
        
        const timeToJump = Math.max(availableCore.currentTime, nextArrival);
        
        // Record IDLE if jump > current
        if (timeToJump > availableCore.currentTime) {
           log(`Core ${availableCore.id}: IDLE from ${availableCore.currentTime} to ${timeToJump}`);
           events.push({
             pid: 'IDLE',
             start: availableCore.currentTime,
             end: timeToJump,
             coreId: availableCore.id
           });
           availableCore.currentTime = timeToJump;
           availableCore.lastPid = 'IDLE';
        }
        
        // Add all arrivals at this new time
        while (pIndex < totalProcesses && processes[pIndex].arrival <= availableCore.currentTime) {
           readyQueue.push(processes[pIndex]);
           pIndex++;
        }
        // Continue loop to pick up from readyQueue
        continue;
      } else {
        // No more processes arriving, queue empty. We are done?
        // But other cores might be running.
        // This core is done forever (until end of sim).
        // We can just conceptually stop this core.
        // But we need loop condition `completedCount < total`.
        // If queue empty and no arrivals, this core is just waiting for others to finish.
        // We can break? No, we might be in `completedCount` loop.
        // Just increment this core's time to Infinity or handle termination.
        // Let's just mark it as "finished" or skip it?
        // Let's skip iteration? But we need to ensure loop terminates.
        // Actually, if readyQueue is empty and pIndex == total, all processes are either running or done.
        // We need to wait for running ones to finish to incr completedCount.
        // But `completedCount` is incremented when we *schedule*? No, when we finish execution.
        // In this simulation loop, we schedule chunks.
        // FCFS is atomic per process.
        // So if queue is empty and pIndex==total, we are done scheduling.
        break; 
      }
    }
    
    // If ready queue has process
    const process = readyQueue.shift()!;
    const { pid, arrival, burst } = process;
    
    // Core `availableCore` runs it.
    // Arrival check: process must have arrived by `availableCore.currentTime`.
    // (Handled by logic above: we only add to readyQueue if arrival <= current)
    // Wait, if `availableCore` was behind `nextArrival` and we jumped, we added to queue.
    // If `availableCore` is ahead of `arrival`, we are good.
    
    // Ensure core time >= arrival (implicit if in ready queue? Yes, because we only push if arrival <= coreTime)
    // Wait, if we pushed to queue because *another* core advanced time?
    // No, we only push based on `availableCore.currentTime`.
    // Actually, `pIndex` logic above relies on `availableCore.currentTime`.
    // Correct.
    
    const c = availableCore;
    
    // Context Switch
    if (contextSwitchOverhead > 0 && c.lastPid !== 'IDLE' && c.lastPid !== pid && c.lastPid !== 'CS') {
        log(`Core ${c.id}: Context Switch ${c.lastPid}->${pid}`);
        events.push({
            pid: 'CS',
            start: c.currentTime,
            end: c.currentTime + contextSwitchOverhead,
            coreId: c.id
        });
        c.currentTime += contextSwitchOverhead;
    }
    
    const start = c.currentTime;
    const end = start + burst;
    
    log(`Core ${c.id}: Runs ${pid} (${start}-${end})`);
    events.push({
        pid,
        start,
        end,
        coreId: c.id
    });
    
    c.currentTime = end;
    c.lastPid = pid;
    completedCount++;
    
    // Metrics
    completionTimes[pid] = end;
    turnaroundTimes[pid] = end - arrival;
    waitingTimes[pid] = turnaroundTimes[pid] - burst;
    
    // Check arrivals up to new time
    // We must be careful: we only advance `pIndex` using the *current* core's time.
    // Other cores might be behind.
    // If we add to readyQueue now, they become available for *any* core.
    // This is correct. Global queue.
    while (pIndex < totalProcesses && processes[pIndex].arrival <= c.currentTime) {
       readyQueue.push(processes[pIndex]);
       pIndex++;
    }
  }

  // Aggregate metrics
  const totalTurnaround = Object.values(turnaroundTimes).reduce((sum, val) => sum + val, 0);
  const totalWaiting = Object.values(waitingTimes).reduce((sum, val) => sum + val, 0);
  
  // Context Switches
  let contextSwitches = 0;
  if (contextSwitchOverhead > 0) {
      contextSwitches = events.filter(e => e.pid === 'CS').length;
  } else {
      // Per core counting
      for (let c=0; c<coreCount; c++) {
          const coreEvents = events.filter(e => e.coreId === c).sort((a,b) => a.start - b.start);
          for (let i = 0; i < coreEvents.length - 1; i++) {
            if (coreEvents[i].pid !== coreEvents[i+1].pid && coreEvents[i].pid !== 'IDLE' && coreEvents[i+1].pid !== 'IDLE') {
              contextSwitches++;
            }
          }
      }
  }
  
  // Energy Calculation
  // Active Time: Sum of durations where pid != IDLE and pid != CS
  // Idle Time: Sum of durations where pid == IDLE (or gaps? events cover gaps)
  // Switch Energy: count * switchJoules
  
  let activeTime = 0;
  let idleTime = 0;
  
  events.forEach(e => {
      const duration = e.end - e.start;
      if (e.pid === 'IDLE') idleTime += duration;
      else if (e.pid === 'CS') {} // Overhead usually counts as active or separate? Let's say separate or active. 
      // Spec: active vs idle. Usually CS consumes power. Let's count CS as Active for power? 
      // Or define switchJoules separate.
      // Let's assume switchJoules covers the switch cost entirely.
      else activeTime += duration;
  });
  
  // Wait, total time is max(end) - 0? Or sum of all core durations?
  // Energy is sum of energy per core.
  // We iterated events. Events cover the timeline for each core (except maybe trailing idle).
  // Trailing idle: from core finish to global max time.
  const globalMaxTime = Math.max(...events.map(e => e.end));
  // Add trailing idle for cores that finished early
  cores.forEach(c => {
      if (c.currentTime < globalMaxTime) {
          idleTime += (globalMaxTime - c.currentTime);
      }
  });
  
  const totalEnergy = (activeTime * energyConfig.activeWatts) + (idleTime * energyConfig.idleWatts) + (contextSwitches * energyConfig.switchJoules);

  const metrics: Metrics = {
    completion: completionTimes,
    turnaround: turnaroundTimes,
    waiting: waitingTimes,
    avgTurnaround: totalProcesses > 0 ? totalTurnaround / totalProcesses : 0,
    avgWaiting: totalProcesses > 0 ? totalWaiting / totalProcesses : 0,
    contextSwitches,
    energy: {
        totalEnergy,
        activeEnergy: activeTime * energyConfig.activeWatts,
        idleEnergy: idleTime * energyConfig.idleWatts,
        switchEnergy: contextSwitches * energyConfig.switchJoules
    }
  };

  return { 
    events, 
    metrics, 
    snapshots: generateSnapshots(events, inputProcesses, coreCount),
    logs: enableLogging ? logs : undefined
  };
}

