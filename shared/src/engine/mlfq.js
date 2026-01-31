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
exports.runMLFQ = runMLFQ;
var utils_js_1 = require('./utils.js');
function runMLFQ(inputProcesses, options) {
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
    return __assign(__assign({}, p), {
      remaining: p.burst,
      currentQueue: 0,
      timeInCurrentQuantum: 0,
    });
  });
  processes.sort(function (a, b) {
    return a.arrival - b.arrival;
  });
  var systemTime = 0;
  var completedCount = 0;
  var totalProcesses = processes.length;
  var events = [];
  var completionTimes = {};
  var turnaroundTimes = {};
  var waitingTimes = {};
  var queues = [[], [], []];
  var quantums = [2, 4, Infinity];
  var pIndex = 0;
  var cores = Array.from({ length: coreCount }, function (_, i) {
    return {
      id: i,
      currentTime: 0,
      lastPid: 'IDLE',
    };
  });
  while (completedCount < totalProcesses) {
    // 1. Arrivals
    while (pIndex < totalProcesses && processes[pIndex].arrival <= systemTime) {
      queues[0].push(processes[pIndex]);
      pIndex++;
    }
    cores.sort(function (a, b) {
      return a.id - b.id;
    });
    var _loop_1 = function (core) {
      if (core.currentTime <= systemTime) {
        var currentlyRunningPids_1 = cores
          .filter(function (c) {
            return c.currentProcessPid && c.currentProcessPid !== 'CS';
          })
          .map(function (c) {
            return c.currentProcessPid;
          });
        // If core is running something, check if there's a higher priority queue with a process ready
        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
          var current = processes.find(function (p) {
            return p.pid === core.currentProcessPid;
          });
          var currentQueueIdx = current.currentQueue;
          var higherPriorityReady = false;
          for (var i = 0; i < currentQueueIdx; i++) {
            if (
              queues[i].filter(function (p) {
                return !currentlyRunningPids_1.includes(p.pid);
              }).length > 0
            ) {
              higherPriorityReady = true;
              break;
            }
          }
          if (higherPriorityReady || current.timeInCurrentQuantum >= quantums[currentQueueIdx]) {
            // Preempt or demote
            if (current.timeInCurrentQuantum >= quantums[currentQueueIdx]) {
              queues[currentQueueIdx].shift();
              var nextQueue = Math.min(2, currentQueueIdx + 1);
              current.currentQueue = nextQueue;
              current.timeInCurrentQuantum = 0;
              queues[nextQueue].push(current);
            }
            core.currentProcessPid = undefined;
          }
        }
        // Assignment if core is free
        if (!core.currentProcessPid) {
          var currentlyRunning_1 = cores
            .filter(function (c) {
              return c.currentProcessPid && c.currentProcessPid !== 'CS';
            })
            .map(function (c) {
              return c.currentProcessPid;
            });
          var selected = void 0;
          for (var i = 0; i < 3; i++) {
            var available = queues[i].filter(function (p) {
              return !currentlyRunning_1.includes(p.pid);
            });
            if (available.length > 0) {
              selected = available[0];
              break;
            }
          }
          if (selected) {
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
    // 2. Scheduler Logic (Preemption and Assignment)
    for (var _i = 0, cores_1 = cores; _i < cores_1.length; _i++) {
      var core = cores_1[_i];
      _loop_1(core);
    }
    // 3. Execution step
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
    var nextCoreFree =
      cores.filter(function (c) {
        return c.currentTime > systemTime;
      }).length > 0
        ? Math.min.apply(
            Math,
            cores
              .filter(function (c) {
                return c.currentTime > systemTime;
              })
              .map(function (c) {
                return c.currentTime;
              })
          )
        : Infinity;
    var nextQuantumOrCompletion =
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
                var p = processes.find(function (proc) {
                  return proc.pid === c.currentProcessPid;
                });
                var timeToQuantum = quantums[p.currentQueue] - p.timeInCurrentQuantum;
                return systemTime + Math.min(p.remaining, timeToQuantum);
              })
          )
        : Infinity;
    var nextEventTime = Math.min(nextArrival, nextCoreFree, nextQuantumOrCompletion);
    if (
      nextEventTime === Infinity &&
      processes.every(function (p) {
        return p.remaining <= 0;
      })
    )
      break;
    var duration = nextEventTime - systemTime;
    if (duration > 0) {
      var _loop_2 = function (core) {
        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
          var p = processes.find(function (proc) {
            return proc.pid === core.currentProcessPid;
          });
          var lastEvent = events
            .filter(function (e) {
              var _a;
              return ((_a = e.coreId) !== null && _a !== void 0 ? _a : 0) === core.id;
            })
            .pop();
          if (lastEvent && lastEvent.pid === p.pid && lastEvent.end === systemTime)
            lastEvent.end = nextEventTime;
          else events.push({ pid: p.pid, start: systemTime, end: nextEventTime, coreId: core.id });
          p.remaining -= duration;
          p.timeInCurrentQuantum += duration;
          core.currentTime = nextEventTime;
          core.lastPid = p.pid;
          if (p.remaining <= 0) {
            completedCount++;
            completionTimes[p.pid] = nextEventTime;
            turnaroundTimes[p.pid] = nextEventTime - p.arrival;
            waitingTimes[p.pid] = turnaroundTimes[p.pid] - p.burst;
            core.currentProcessPid = undefined;
            queues[p.currentQueue].shift();
          }
        } else if (!core.currentProcessPid) {
          var lastEvent = events
            .filter(function (e) {
              var _a;
              return ((_a = e.coreId) !== null && _a !== void 0 ? _a : 0) === core.id;
            })
            .pop();
          if (lastEvent && lastEvent.pid === 'IDLE' && lastEvent.end === systemTime)
            lastEvent.end = nextEventTime;
          else events.push({ pid: 'IDLE', start: systemTime, end: nextEventTime, coreId: core.id });
          core.currentTime = nextEventTime;
          core.lastPid = 'IDLE';
        } else if (core.currentProcessPid === 'CS') {
          if (core.currentTime <= nextEventTime) core.currentProcessPid = undefined;
        }
      };
      for (var _d = 0, cores_2 = cores; _d < cores_2.length; _d++) {
        var core = cores_2[_d];
        _loop_2(core);
      }
      systemTime = nextEventTime;
    } else {
      systemTime += 0.1;
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
  if (contextSwitchOverhead > 0)
    contextSwitches = events.filter(function (e) {
      return e.pid === 'CS';
    }).length;
  else {
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
      delete e.coreId;
    });
  return {
    events: events,
    metrics: metrics,
    snapshots: (0, utils_js_1.generateSnapshots)(events, inputProcesses, coreCount),
  };
}
