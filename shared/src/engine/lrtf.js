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
exports.runLRTF = runLRTF;
var utils_js_1 = require('./utils.js');
function runLRTF(inputProcesses, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.contextSwitchOverhead,
    contextSwitchOverhead = _a === void 0 ? 0 : _a,
    _b = options.coreCount,
    coreCount = _b === void 0 ? 1 : _b,
    _c = options.energyConfig,
    energyConfig = _c === void 0 ? { activeWatts: 20, idleWatts: 5, switchJoules: 0.1 } : _c;
  var processes = inputProcesses.map(function (p) {
    return __assign(__assign({}, p), { remaining: p.burst });
  });
  var systemTime = 0;
  var completedCount = 0;
  var totalProcesses = processes.length;
  var events = [];
  var completionTimes = {};
  var turnaroundTimes = {};
  var waitingTimes = {};
  var cores = Array.from({ length: coreCount }, function (_, i) {
    return {
      id: i,
      currentTime: 0,
      lastPid: 'IDLE',
      busyUntil: 0,
    };
  });
  var getReadyQueue = function (time, currentlyRunningPids) {
    return processes.filter(function (p) {
      return p.arrival <= time && p.remaining > 0 && !currentlyRunningPids.includes(p.pid);
    });
  };
  while (completedCount < totalProcesses) {
    cores.sort(function (a, b) {
      return a.id - b.id;
    });
    var _loop_1 = function (core) {
      if (systemTime >= core.busyUntil) {
        var currentlyRunningPids = cores
          .filter(function (c) {
            return c.currentProcessPid && c.currentProcessPid !== 'CS' && systemTime < c.busyUntil;
          })
          .map(function (c) {
            return c.currentProcessPid;
          });
        var readyQueue = getReadyQueue(systemTime, currentlyRunningPids);
        readyQueue.sort(function (a, b) {
          return a.remaining !== b.remaining ? b.remaining - a.remaining : a.arrival - b.arrival;
        });
        // If core was running something, check for preemption
        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
          var current = processes.find(function (p) {
            return p.pid === core.currentProcessPid;
          });
          if (readyQueue.length > 0 && readyQueue[0].remaining > current.remaining) {
            core.currentProcessPid = undefined; // Trigger re-selection
          }
        }
        // Selection
        if (!core.currentProcessPid || systemTime >= core.busyUntil) {
          readyQueue = getReadyQueue(
            systemTime,
            cores
              .filter(function (c) {
                return (
                  c.currentProcessPid && c.currentProcessPid !== 'CS' && systemTime < c.busyUntil
                );
              })
              .map(function (c) {
                return c.currentProcessPid;
              })
          );
          readyQueue.sort(function (a, b) {
            return a.remaining !== b.remaining ? b.remaining - a.remaining : a.arrival - b.arrival;
          });
          if (readyQueue.length > 0) {
            var selected = readyQueue[0];
            if (
              contextSwitchOverhead > 0 &&
              core.lastPid !== 'IDLE' &&
              core.lastPid !== selected.pid &&
              core.lastPid !== 'CS'
            ) {
              events.push({
                pid: 'CS',
                start: systemTime,
                end: systemTime + contextSwitchOverhead,
                coreId: core.id,
              });
              core.busyUntil = systemTime + contextSwitchOverhead;
              core.currentProcessPid = 'CS';
              core.lastPid = 'CS';
            } else {
              core.currentProcessPid = selected.pid;
              core.busyUntil = systemTime + 1; // Step by 1
            }
          } else {
            core.currentProcessPid = undefined;
            core.busyUntil = systemTime + 1;
          }
        }
      }
    };
    // 1. Core assignment and Preemption check
    for (var _i = 0, cores_1 = cores; _i < cores_1.length; _i++) {
      var core = cores_1[_i];
      _loop_1(core);
    }
    // 2. Advance time by 1 unit
    var nextTime = systemTime + 1;
    var _loop_2 = function (core) {
      if (
        core.currentProcessPid &&
        core.currentProcessPid !== 'CS' &&
        systemTime < core.busyUntil
      ) {
        var p = processes.find(function (p) {
          return p.pid === core.currentProcessPid;
        });
        var lastEvent = events
          .filter(function (e) {
            var _a;
            return ((_a = e.coreId) !== null && _a !== void 0 ? _a : 0) === core.id;
          })
          .pop();
        if (lastEvent && lastEvent.pid === p.pid && lastEvent.end === systemTime) {
          lastEvent.end = nextTime;
        } else {
          events.push({ pid: p.pid, start: systemTime, end: nextTime, coreId: core.id });
        }
        p.remaining -= 1;
        core.lastPid = p.pid;
        if (p.remaining <= 0) {
          completedCount++;
          completionTimes[p.pid] = nextTime;
          turnaroundTimes[p.pid] = nextTime - p.arrival;
          waitingTimes[p.pid] = turnaroundTimes[p.pid] - p.burst;
          core.currentProcessPid = undefined;
          core.busyUntil = nextTime;
        }
      } else if (!core.currentProcessPid && systemTime < core.busyUntil) {
        var lastEvent = events
          .filter(function (e) {
            var _a;
            return ((_a = e.coreId) !== null && _a !== void 0 ? _a : 0) === core.id;
          })
          .pop();
        if (lastEvent && lastEvent.pid === 'IDLE' && lastEvent.end === systemTime) {
          lastEvent.end = nextTime;
        } else {
          events.push({ pid: 'IDLE', start: systemTime, end: nextTime, coreId: core.id });
        }
        core.lastPid = 'IDLE';
      }
    };
    for (var _d = 0, cores_2 = cores; _d < cores_2.length; _d++) {
      var core = cores_2[_d];
      _loop_2(core);
    }
    systemTime = nextTime;
    // Stop if all done
    if (
      processes.every(function (p) {
        return p.remaining <= 0;
      }) &&
      cores.every(function (c) {
        return systemTime >= c.busyUntil;
      })
    )
      break;
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
    var _loop_3 = function (c) {
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
        )
          contextSwitches++;
      }
    };
    for (var c = 0; c < coreCount; c++) {
      _loop_3(c);
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
  var cpuUtilization = (activeTime / ((globalMaxTime || 1) * coreCount)) * 100;
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
      delete e.coreId;
    });
  }
  return {
    events: events,
    metrics: metrics,
    snapshots: (0, utils_js_1.generateSnapshots)(events, inputProcesses, coreCount),
  };
}
