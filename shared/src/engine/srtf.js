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
exports.runSRTF = runSRTF;
var utils_js_1 = require('./utils.js');
function runSRTF(inputProcesses, options) {
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
  // 1. Setup working copy with 'remaining' burst time
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
    };
  });
  // Helper to get ready processes (not currently running on any core)
  var getReadyQueue = function (time, currentlyRunningPids) {
    return processes.filter(function (p) {
      return p.arrival <= time && p.remaining > 0 && !currentlyRunningPids.includes(p.pid);
    });
  };
  while (completedCount < totalProcesses) {
    // 1. Assign or Preempt cores
    cores.sort(function (a, b) {
      return a.id - b.id;
    });
    var _loop_1 = function (core) {
      if (core.currentTime <= systemTime) {
        var currentlyRunningPids = cores
          .filter(function (c) {
            return c.currentProcessPid && c.currentProcessPid !== 'CS';
          })
          .map(function (c) {
            return c.currentProcessPid;
          });
        var readyQueue = getReadyQueue(systemTime, currentlyRunningPids);
        // If core is running something, check for preemption
        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
          var current = processes.find(function (p) {
            return p.pid === core.currentProcessPid;
          });
          readyQueue.sort(function (a, b) {
            return a.remaining !== b.remaining ? a.remaining - b.remaining : a.arrival - b.arrival;
          });
          if (readyQueue.length > 0 && readyQueue[0].remaining < current.remaining) {
            // Preempt!
            var preemptedPid = current.pid;
            var selected = readyQueue[0];
            logDecision(
              systemTime,
              core.id,
              'Preempting '.concat(preemptedPid, ' for ').concat(selected.pid),
              'New process has shorter remaining time ('
                .concat(selected.remaining, ' < ')
                .concat(current.remaining, ')'),
              readyQueue.map(function (p) {
                return p.pid;
              })
            );
            core.currentProcessPid = undefined; // Will trigger re-selection below
          }
        }
        // If core is free (or just preempted)
        if (!core.currentProcessPid) {
          readyQueue = getReadyQueue(
            systemTime,
            cores
              .filter(function (c) {
                return c.currentProcessPid && c.currentProcessPid !== 'CS';
              })
              .map(function (c) {
                return c.currentProcessPid;
              })
          );
          if (readyQueue.length > 0) {
            readyQueue.sort(function (a, b) {
              return a.remaining !== b.remaining
                ? a.remaining - b.remaining
                : a.arrival - b.arrival;
            });
            var selected = readyQueue[0];
            // Context Switch
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
              core.currentTime = systemTime + contextSwitchOverhead;
              core.currentProcessPid = 'CS';
              core.lastPid = 'CS';
            } else {
              core.currentProcessPid = selected.pid;
            }
          }
        }
      }
    };
    for (var _i = 0, cores_1 = cores; _i < cores_1.length; _i++) {
      var core = cores_1[_i];
      _loop_1(core);
    }
    // 2. Determine next event
    var nextArrival =
      processes.filter(function (p) {
        return p.arrival > systemTime;
      }).length > 0
        ? Math.min.apply(
            Math,
            processes
              .filter(function (p) {
                return p.arrival > systemTime;
              })
              .map(function (p) {
                return p.arrival;
              })
          )
        : Infinity;
    var nextCompletion =
      cores.filter(function (c) {
        return c.currentProcessPid && c.currentProcessPid !== 'CS';
      }).length > 0
        ? Math.min.apply(
            Math,
            cores
              .filter(function (c) {
                return c.currentProcessPid && c.currentProcessPid !== 'CS';
              })
              .map(function (c) {
                var p = processes.find(function (p) {
                  return p.pid === c.currentProcessPid;
                });
                return systemTime + p.remaining;
              })
          )
        : Infinity;
    var nextCSFinish =
      cores.filter(function (c) {
        return c.currentProcessPid === 'CS';
      }).length > 0
        ? Math.min.apply(
            Math,
            cores
              .filter(function (c) {
                return c.currentProcessPid === 'CS';
              })
              .map(function (c) {
                return c.currentTime;
              })
          )
        : Infinity;
    var nextEventTime = Math.min(nextArrival, nextCompletion, nextCSFinish);
    if (nextEventTime === Infinity) break;
    var duration = nextEventTime - systemTime;
    if (duration > 0) {
      var _loop_2 = function (core) {
        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
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
            lastEvent.end = nextEventTime;
          } else {
            events.push({ pid: p.pid, start: systemTime, end: nextEventTime, coreId: core.id });
          }
          p.remaining -= duration;
          core.currentTime = nextEventTime;
          core.lastPid = p.pid;
          if (p.remaining <= 0) {
            completedCount++;
            completionTimes[p.pid] = nextEventTime;
            turnaroundTimes[p.pid] = nextEventTime - p.arrival;
            waitingTimes[p.pid] = turnaroundTimes[p.pid] - p.burst;
            core.currentProcessPid = undefined;
          }
        } else if (!core.currentProcessPid) {
          var lastEvent = events
            .filter(function (e) {
              var _a;
              return ((_a = e.coreId) !== null && _a !== void 0 ? _a : 0) === core.id;
            })
            .pop();
          if (lastEvent && lastEvent.pid === 'IDLE' && lastEvent.end === systemTime) {
            lastEvent.end = nextEventTime;
          } else {
            events.push({ pid: 'IDLE', start: systemTime, end: nextEventTime, coreId: core.id });
          }
          core.currentTime = nextEventTime;
          core.lastPid = 'IDLE';
        } else if (core.currentProcessPid === 'CS') {
          if (core.currentTime <= nextEventTime) core.currentProcessPid = undefined;
        }
      };
      for (var _e = 0, cores_2 = cores; _e < cores_2.length; _e++) {
        var core = cores_2[_e];
        _loop_2(core);
      }
      systemTime = nextEventTime;
    } else {
      systemTime += 0.1;
    }
    systemTime = Math.round(systemTime * 100) / 100;
  }
  // Aggregate Metrics
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
        ) {
          contextSwitches++;
        }
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
