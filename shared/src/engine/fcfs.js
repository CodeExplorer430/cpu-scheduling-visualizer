'use strict';
var __spreadArray =
  (this && this.__spreadArray) ||
  function (to, from, pack) {
    if (pack || arguments.length === 2)
      for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
          if (!ar) ar = Array.prototype.slice.call(from, 0, i);
          ar[i] = from[i];
        }
      }
    return to.concat(ar || Array.prototype.slice.call(from));
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.runFCFS = runFCFS;
var utils_js_1 = require('./utils.js');
function runFCFS(inputProcesses, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.contextSwitchOverhead,
    contextSwitchOverhead = _a === void 0 ? 0 : _a,
    _b = options.enableLogging,
    enableLogging = _b === void 0 ? false : _b,
    _c = options.coreCount,
    coreCount = _c === void 0 ? 1 : _c,
    _d = options.energyConfig,
    energyConfig = _d === void 0 ? { activeWatts: 20, idleWatts: 5, switchJoules: 0.1 } : _d;
  var logs = [];
  var stepLogs = [];
  var log = function (msg) {
    if (enableLogging) logs.push(msg);
  };
  var logDecision = function (time, coreId, message, reason, queueState) {
    if (enableLogging)
      stepLogs.push({
        time: time,
        coreId: coreId,
        message: message,
        reason: reason,
        queueState: queueState,
      });
  };
  // 1. Sort by arrival time (FCFS rule)
  var processes = __spreadArray([], inputProcesses, true).sort(function (a, b) {
    return a.arrival - b.arrival;
  });
  var events = [];
  var completionTimes = {};
  var turnaroundTimes = {};
  var waitingTimes = {};
  var cores = Array.from({ length: coreCount }, function (_, i) {
    return {
      id: i,
      currentTime: 0,
      lastPid: 'IDLE',
    };
  });
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
  var completedCount = 0;
  var totalProcesses = processes.length;
  var pIndex = 0; // Index in sorted arrival list
  var readyQueue = [];
  // Simulation Clock?
  // We can jump to the next "interesting" time: min(nextArrival, min(coreFreeTime))
  while (completedCount < totalProcesses) {
    // 1. Find earliest time something happens
    // Next arrival?
    var nextArrival = pIndex < totalProcesses ? processes[pIndex].arrival : Infinity;
    // Earliest core free?
    // const nextCoreFree = Math.min(...cores.map((c) => c.currentTime));
    // Global time advances to the interesting point
    // Ideally we process events at `nextCoreFree` if it's <= nextArrival, or `nextArrival` if it's earlier.
    // Actually, we can fill cores up to `nextArrival` if they are free.
    // Let's sort cores by free time
    cores.sort(function (a, b) {
      return a.currentTime - b.currentTime;
    });
    var availableCore = cores[0]; // Core that frees up earliest
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
        var timeToJump = Math.max(availableCore.currentTime, nextArrival);
        // Record IDLE if jump > current
        if (timeToJump > availableCore.currentTime) {
          log(
            'Core '
              .concat(availableCore.id, ': IDLE from ')
              .concat(availableCore.currentTime, ' to ')
              .concat(timeToJump)
          );
          logDecision(
            availableCore.currentTime,
            availableCore.id,
            'IDLE until '.concat(timeToJump),
            'No process available in ready queue. Next arrival at '.concat(nextArrival, '.'),
            []
          );
          events.push({
            pid: 'IDLE',
            start: availableCore.currentTime,
            end: timeToJump,
            coreId: availableCore.id,
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
        break;
      }
    }
    // If ready queue has process
    // Capture state before shift
    var currentQueuePids = readyQueue.map(function (p) {
      return p.pid;
    });
    var process_1 = readyQueue.shift();
    var pid = process_1.pid,
      arrival = process_1.arrival,
      burst = process_1.burst;
    // Log decision
    logDecision(
      availableCore.currentTime,
      availableCore.id,
      'Selected Process '.concat(pid),
      'Selected '
        .concat(pid, ' because it arrived earliest (Arrival: ')
        .concat(arrival, '). FCFS logic.'),
      currentQueuePids
    );
    var c = availableCore;
    // Context Switch
    if (
      contextSwitchOverhead > 0 &&
      c.lastPid !== 'IDLE' &&
      c.lastPid !== pid &&
      c.lastPid !== 'CS'
    ) {
      log('Core '.concat(c.id, ': Context Switch ').concat(c.lastPid, '->').concat(pid));
      events.push({
        pid: 'CS',
        start: c.currentTime,
        end: c.currentTime + contextSwitchOverhead,
        coreId: c.id,
      });
      c.currentTime += contextSwitchOverhead;
    }
    var start = c.currentTime;
    var end = start + burst;
    log('Core '.concat(c.id, ': Runs ').concat(pid, ' (').concat(start, '-').concat(end, ')'));
    events.push({
      pid: pid,
      start: start,
      end: end,
      coreId: c.id,
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
  var totalTurnaround = Object.values(turnaroundTimes).reduce(function (sum, val) {
    return sum + val;
  }, 0);
  var totalWaiting = Object.values(waitingTimes).reduce(function (sum, val) {
    return sum + val;
  }, 0);
  // Context Switches
  var contextSwitches = 0;
  if (contextSwitchOverhead > 0) {
    contextSwitches = events.filter(function (e) {
      return e.pid === 'CS';
    }).length;
  } else {
    var _loop_1 = function (c) {
      var coreEvents = events
        .filter(function (e) {
          return e.coreId === c;
        })
        .sort(function (a, b) {
          return a.start - b.start;
        });
      for (var i = 0; i < coreEvents.length - 1; i++) {
        if (
          coreEvents[i].pid !== coreEvents[i + 1].pid &&
          coreEvents[i].pid !== 'IDLE' &&
          coreEvents[i + 1].pid !== 'IDLE'
        ) {
          contextSwitches++;
        }
      }
    };
    // Per core counting
    for (var c = 0; c < coreCount; c++) {
      _loop_1(c);
    }
  }
  // Energy Calculation
  // Active Time: Sum of durations where pid != IDLE and pid != CS
  // Idle Time: Sum of durations where pid == IDLE (or gaps? events cover gaps)
  // Switch Energy: count * switchJoules
  var activeTime = 0;
  var idleTime = 0;
  events.forEach(function (e) {
    var duration = e.end - e.start;
    if (e.pid === 'IDLE') idleTime += duration;
    else if (e.pid === 'CS') {
      // Switch energy is calculated separately using switchJoules
    }
    // Overhead usually counts as active or separate? Let's say separate or active.
    // Spec: active vs idle. Usually CS consumes power. Let's count CS as Active for power?
    // Or define switchJoules separate.
    // Let's assume switchJoules covers the switch cost entirely.
    else activeTime += duration;
  });
  // Wait, total time is max(end) - 0? Or sum of all core durations?
  // Energy is sum of energy per core.
  // We iterated events. Events cover the timeline for each core (except maybe trailing idle).
  // Trailing idle: from core finish to global max time.
  var globalMaxTime = Math.max.apply(
    Math,
    events.map(function (e) {
      return e.end;
    })
  );
  // Add trailing idle for cores that finished early
  cores.forEach(function (c) {
    if (c.currentTime < globalMaxTime) {
      idleTime += globalMaxTime - c.currentTime;
    }
  });
  var totalEnergy =
    activeTime * energyConfig.activeWatts +
    idleTime * energyConfig.idleWatts +
    contextSwitches * energyConfig.switchJoules;
  var totalTime = globalMaxTime > 0 ? globalMaxTime : 1; // Avoid div by 0
  // Utilization: Active time across all cores / (Total time * Core count)
  // Wait, activeTime calculated above is sum of event durations.
  // Events cover all cores.
  // So cpuUtilization = (activeTime / (totalTime * coreCount)) * 100.
  var cpuUtilization = (activeTime / (totalTime * coreCount)) * 100;
  var metrics = {
    completion: completionTimes,
    turnaround: turnaroundTimes,
    waiting: waitingTimes,
    avgTurnaround: totalProcesses > 0 ? totalTurnaround / totalProcesses : 0,
    avgWaiting: totalProcesses > 0 ? totalWaiting / totalProcesses : 0,
    contextSwitches: contextSwitches,
    cpuUtilization: cpuUtilization,
    energy: {
      totalEnergy: totalEnergy,
      activeEnergy: activeTime * energyConfig.activeWatts,
      idleEnergy: idleTime * energyConfig.idleWatts,
      switchEnergy: contextSwitches * energyConfig.switchJoules,
    },
  };
  return {
    events: events,
    metrics: metrics,
    snapshots: (0, utils_js_1.generateSnapshots)(events, inputProcesses, coreCount),
    logs: enableLogging ? logs : undefined,
    stepLogs: enableLogging ? stepLogs : undefined,
  };
}
