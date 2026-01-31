'use strict';
var __assign =
  (this && this.__assign) ||
  function () {
    __assign =
      Object.assign ||
      function (t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
          s = arguments[i];
          for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
      };
    return __assign.apply(this, arguments);
  };
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
exports.runRR = runRR;
var utils_js_1 = require('./utils.js');
function runRR(inputProcesses, optionsOrQuantum) {
  if (optionsOrQuantum === void 0) {
    optionsOrQuantum = 2;
  }
  var options =
    typeof optionsOrQuantum === 'number' ? { quantum: optionsOrQuantum } : optionsOrQuantum;
  var _a = options.quantum,
    quantum = _a === void 0 ? 2 : _a,
    _b = options.contextSwitchOverhead,
    contextSwitchOverhead = _b === void 0 ? 0 : _b,
    _c = options.enableLogging,
    enableLogging = _c === void 0 ? false : _c,
    _d = options.coreCount,
    coreCount = _d === void 0 ? 1 : _d,
    _e = options.energyConfig,
    energyConfig = _e === void 0 ? { activeWatts: 20, idleWatts: 5, switchJoules: 0.1 } : _e;
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
  // Deep copy + add remaining burst
  var processes = inputProcesses.map(function (p) {
    return __assign(__assign({}, p), { remaining: p.burst });
  });
  // Sort by arrival initially
  var sortedByArrival = __spreadArray([], processes, true).sort(function (a, b) {
    return a.arrival - b.arrival;
  });
  var events = [];
  var completionTimes = {};
  var turnaroundTimes = {};
  var waitingTimes = {};
  var readyQueue = [];
  var pIndex = 0;
  var completedCount = 0;
  var totalProcesses = processes.length;
  var cores = Array.from({ length: coreCount }, function (_, i) {
    return {
      id: i,
      currentTime: 0,
      lastPid: 'IDLE',
    };
  });
  // Simulation Clock
  var systemTime = 0;
  while (completedCount < totalProcesses) {
    // 1. Enqueue arrivals up to systemTime
    while (pIndex < totalProcesses && sortedByArrival[pIndex].arrival <= systemTime) {
      readyQueue.push(sortedByArrival[pIndex]);
      log('Time '.concat(systemTime, ': Process ').concat(sortedByArrival[pIndex].pid, ' arrived'));
      pIndex++;
    }
    // 2. Assign available cores to processes in readyQueue
    cores.sort(function (a, b) {
      return a.currentTime - b.currentTime || a.id - b.id;
    });
    var assignedThisStep = false;
    for (var _i = 0, cores_1 = cores; _i < cores_1.length; _i++) {
      var core = cores_1[_i];
      if (core.currentTime <= systemTime && readyQueue.length > 0) {
        var currentProcess = readyQueue.shift();
        var queueState = __spreadArray(
          [currentProcess.pid],
          readyQueue.map(function (p) {
            return p.pid;
          }),
          true
        );
        logDecision(
          core.currentTime,
          core.id,
          'Selected '.concat(currentProcess.pid),
          'Selected '
            .concat(currentProcess.pid, ' from head of queue. Quantum: ')
            .concat(quantum, '.'),
          queueState
        );
        if (
          contextSwitchOverhead > 0 &&
          core.lastPid !== 'IDLE' &&
          core.lastPid !== currentProcess.pid &&
          core.lastPid !== 'CS'
        ) {
          events.push({
            pid: 'CS',
            start: core.currentTime,
            end: core.currentTime + contextSwitchOverhead,
            coreId: core.id,
          });
          core.currentTime += contextSwitchOverhead;
        }
        var runTime = Math.min(currentProcess.remaining, quantum);
        var start = core.currentTime;
        var end = start + runTime;
        events.push({
          pid: currentProcess.pid,
          start: start,
          end: end,
          coreId: core.id,
        });
        core.currentTime = end;
        currentProcess.remaining -= runTime;
        core.lastPid = currentProcess.pid;
        assignedThisStep = true;
        if (currentProcess.remaining > 0) {
          currentProcess.nextAvailableAt = end;
        } else {
          completedCount++;
          completionTimes[currentProcess.pid] = end;
          turnaroundTimes[currentProcess.pid] = end - currentProcess.arrival;
          waitingTimes[currentProcess.pid] =
            turnaroundTimes[currentProcess.pid] - currentProcess.burst;
        }
      }
    }
    var nextArrival = pIndex < totalProcesses ? sortedByArrival[pIndex].arrival : Infinity;
    var nextCoreFree = Math.min.apply(
      Math,
      cores.map(function (c) {
        return c.currentTime;
      })
    );
    var sliceFinishedProcesses = processes.filter(function (p) {
      return p.remaining > 0 && p.nextAvailableAt !== undefined;
    });
    var nextSliceFinish =
      sliceFinishedProcesses.length > 0
        ? Math.min.apply(
            Math,
            sliceFinishedProcesses.map(function (p) {
              return p.nextAvailableAt;
            })
          )
        : Infinity;
    var nextEventTime = Math.min(nextArrival, nextCoreFree, nextSliceFinish);
    if (nextEventTime === Infinity && readyQueue.length === 0) break;
    if (
      readyQueue.length === 0 &&
      pIndex < totalProcesses &&
      nextArrival > systemTime &&
      cores.every(function (c) {
        return c.currentTime <= systemTime;
      })
    ) {
      for (var _f = 0, cores_2 = cores; _f < cores_2.length; _f++) {
        var core = cores_2[_f];
        if (core.currentTime <= systemTime) {
          events.push({
            pid: 'IDLE',
            start: core.currentTime,
            end: nextArrival,
            coreId: core.id,
          });
          core.currentTime = nextArrival;
          core.lastPid = 'IDLE';
        }
      }
      systemTime = nextArrival;
    } else if (nextEventTime > systemTime) {
      systemTime = nextEventTime;
    } else if (
      !assignedThisStep &&
      readyQueue.length === 0 &&
      pIndex >= totalProcesses &&
      sliceFinishedProcesses.length > 0
    ) {
      systemTime = nextSliceFinish;
    } else if (!assignedThisStep && readyQueue.length === 0 && pIndex < totalProcesses) {
      systemTime = nextArrival;
    } else {
      var earliestBusyCoreFinish = Math.min.apply(
        Math,
        cores
          .filter(function (c) {
            return c.currentTime > systemTime;
          })
          .map(function (c) {
            return c.currentTime;
          })
      );
      systemTime = earliestBusyCoreFinish !== Infinity ? earliestBusyCoreFinish : systemTime + 1;
    }
    systemTime = Math.round(systemTime * 100) / 100;
    processes.forEach(function (p) {
      if (p.remaining > 0 && p.nextAvailableAt !== undefined && p.nextAvailableAt <= systemTime) {
        readyQueue.push(p);
        delete p.nextAvailableAt;
      }
    });
  }
  var totalTurnaround = Object.values(turnaroundTimes).reduce(function (sum, val) {
    return sum + val;
  }, 0);
  var totalWaiting = Object.values(waitingTimes).reduce(function (sum, val) {
    return sum + val;
  }, 0);
  var contextSwitches = 0;
  if (contextSwitchOverhead > 0) {
    contextSwitches = events.filter(function (e) {
      return e.pid === 'CS';
    }).length;
  } else {
    var _loop_1 = function (c) {
      var coreEvents = events
        .filter(function (e) {
          var _a;
          return ((_a = e.coreId) !== null && _a !== void 0 ? _a : 0) === c;
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
    for (var c = 0; c < coreCount; c++) {
      _loop_1(c);
    }
  }
  var activeTime = 0;
  var idleTime = 0;
  events.forEach(function (e) {
    var duration = e.end - e.start;
    if (e.pid === 'IDLE') idleTime += duration;
    else if (e.pid !== 'CS') activeTime += duration;
  });
  var globalMaxTime =
    events.length > 0
      ? Math.max.apply(
          Math,
          events.map(function (e) {
            return e.end;
          })
        )
      : 0;
  var totalTime = globalMaxTime > 0 ? globalMaxTime : 1;
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
      totalEnergy:
        activeTime * energyConfig.activeWatts +
        idleTime * energyConfig.idleWatts +
        contextSwitches * energyConfig.switchJoules,
      activeEnergy: activeTime * energyConfig.activeWatts,
      idleEnergy: idleTime * energyConfig.idleWatts,
      switchEnergy: contextSwitches * energyConfig.switchJoules,
    },
  };
  if (coreCount === 1) {
    events.forEach(function (e) {
      return delete e.coreId;
    });
  }
  return {
    events: events,
    metrics: metrics,
    snapshots: (0, utils_js_1.generateSnapshots)(events, inputProcesses, coreCount),
    logs: enableLogging ? logs : undefined,
    stepLogs: enableLogging ? stepLogs : undefined,
  };
}
