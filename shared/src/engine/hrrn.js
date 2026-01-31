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
Object.defineProperty(exports, '__esModule', { value: true });
exports.runHRRN = runHRRN;
var utils_js_1 = require('./utils.js');
/**
 * HRRN (Highest Response Ratio Next)
 * Response Ratio = (Waiting Time + Burst Time) / Burst Time
 */
function runHRRN(inputProcesses, options) {
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
    // 2. Select Highest Response Ratio for available cores
    cores.sort(function (a, b) {
      return a.currentTime - b.currentTime || a.id - b.id;
    });
    var assignedThisStep = false;
    var _loop_1 = function (core) {
      if (core.currentTime <= systemTime && readyQueue.length > 0) {
        var selectedIndex_1 = -1;
        var maxRatio_1 = -1;
        var queueState_1 = [];
        readyQueue.forEach(function (p, idx) {
          var waitTime = core.currentTime - p.arrival;
          var responseRatio = (waitTime + p.burst) / p.burst;
          queueState_1.push(''.concat(p.pid, '(RR:').concat(responseRatio.toFixed(2), ')'));
          if (responseRatio > maxRatio_1) {
            maxRatio_1 = responseRatio;
            selectedIndex_1 = idx;
          } else if (responseRatio === maxRatio_1) {
            if (p.arrival < readyQueue[selectedIndex_1].arrival) {
              selectedIndex_1 = idx;
            }
          }
        });
        var currentProcess = readyQueue.splice(selectedIndex_1, 1)[0];
        logDecision(
          core.currentTime,
          core.id,
          'Selected '.concat(currentProcess.pid),
          'Selected '
            .concat(currentProcess.pid, ' with the highest Response Ratio: ')
            .concat(maxRatio_1.toFixed(2)),
          queueState_1
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
        var start = core.currentTime;
        var end = start + currentProcess.burst;
        events.push({ pid: currentProcess.pid, start: start, end: end, coreId: core.id });
        core.currentTime = end;
        core.lastPid = currentProcess.pid;
        completedCount++;
        assignedThisStep = true;
        completionTimes[currentProcess.pid] = end;
        turnaroundTimes[currentProcess.pid] = end - currentProcess.arrival;
        waitingTimes[currentProcess.pid] =
          turnaroundTimes[currentProcess.pid] - currentProcess.burst;
      }
    };
    for (var _i = 0, cores_1 = cores; _i < cores_1.length; _i++) {
      var core = cores_1[_i];
      _loop_1(core);
    }
    var nextArrival = pIndex < totalProcesses ? processes[pIndex].arrival : Infinity;
    var nextCoreFree = Math.min.apply(
      Math,
      cores.map(function (c) {
        return c.currentTime;
      })
    );
    var nextTime = Math.min(nextArrival, nextCoreFree);
    if (nextTime === Infinity && readyQueue.length === 0) break;
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
    var _loop_2 = function (c) {
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
      _loop_2(c);
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
  if (coreCount === 1)
    events.forEach(function (e) {
      return delete e.coreId;
    });
  return {
    events: events,
    metrics: metrics,
    snapshots: (0, utils_js_1.generateSnapshots)(events, inputProcesses, coreCount),
    logs: enableLogging ? logs : undefined,
    stepLogs: enableLogging ? stepLogs : undefined,
  };
}
