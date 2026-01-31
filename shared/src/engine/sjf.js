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
exports.runSJF = runSJF;
var utils_js_1 = require('./utils.js');
function runSJF(inputProcesses, options) {
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
  // Deep copy
  var processes = inputProcesses.map(function (p) {
    return __assign({}, p);
  });
  processes.sort(function (a, b) {
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
  var systemTime = 0;
  while (completedCount < totalProcesses) {
    // 1. Enqueue arrivals
    while (pIndex < totalProcesses && processes[pIndex].arrival <= systemTime) {
      log('Time '.concat(systemTime, ': Process ').concat(processes[pIndex].pid, ' arrived'));
      readyQueue.push(processes[pIndex]);
      pIndex++;
    }
    // 2. Select shortest burst for available cores
    cores.sort(function (a, b) {
      return a.currentTime - b.currentTime || a.id - b.id;
    });
    var assignedThisStep = false;
    for (var _i = 0, cores_1 = cores; _i < cores_1.length; _i++) {
      var core = cores_1[_i];
      if (core.currentTime <= systemTime && readyQueue.length > 0) {
        readyQueue.sort(function (a, b) {
          if (a.burst !== b.burst) return a.burst - b.burst;
          return a.arrival - b.arrival;
        });
        var currentProcess = readyQueue.shift();
        var queueState = __spreadArray(
          [currentProcess.pid],
          readyQueue.map(function (p) {
            return ''.concat(p.pid, '(').concat(p.burst, ')');
          }),
          true
        );
        logDecision(
          core.currentTime,
          core.id,
          'Selected '.concat(currentProcess.pid),
          'Selected '
            .concat(currentProcess.pid, ' because it has the shortest burst time (')
            .concat(currentProcess.burst, ').'),
          queueState
        );
        // Context Switch
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
        var start = core.currentTime;
        var end = start + currentProcess.burst;
        events.push({
          pid: currentProcess.pid,
          start: start,
          end: end,
          coreId: core.id,
        });
        core.currentTime = end;
        core.lastPid = currentProcess.pid;
        completedCount++;
        assignedThisStep = true;
        completionTimes[currentProcess.pid] = end;
        turnaroundTimes[currentProcess.pid] = end - currentProcess.arrival;
        waitingTimes[currentProcess.pid] =
          turnaroundTimes[currentProcess.pid] - currentProcess.burst;
      }
    }
    // 3. Advance system time
    var nextArrival = pIndex < totalProcesses ? processes[pIndex].arrival : Infinity;
    var nextCoreFree = Math.min.apply(
      Math,
      cores.map(function (c) {
        return c.currentTime;
      })
    );
    var nextTime = Math.min(nextArrival, nextCoreFree);
    if (nextTime === Infinity && readyQueue.length === 0) break;
    // Handle IDLE
    if (
      readyQueue.length === 0 &&
      pIndex < totalProcesses &&
      nextArrival > systemTime &&
      cores.every(function (c) {
        return c.currentTime <= systemTime;
      })
    ) {
      for (var _e = 0, cores_2 = cores; _e < cores_2.length; _e++) {
        var core = cores_2[_e];
        if (core.currentTime <= systemTime) {
          events.push({ pid: 'IDLE', start: core.currentTime, end: nextArrival, coreId: core.id });
          core.currentTime = nextArrival;
          core.lastPid = 'IDLE';
        }
      }
      systemTime = nextArrival;
    } else if (nextTime > systemTime) {
      systemTime = nextTime;
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
  }
  // Aggregate metrics
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
  // Clean up coreId for single-core to keep tests happy
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
