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
exports.runMQ = runMQ;
var utils_js_1 = require('./utils.js');
function runMQ(inputProcesses, options) {
  var _a, _b, _c, _d;
  if (options === void 0) {
    options = {};
  }
  var _e = options.contextSwitchOverhead,
    contextSwitchOverhead = _e === void 0 ? 0 : _e,
    _f = options.quantum,
    quantum = _f === void 0 ? 2 : _f,
    _g = options.coreCount,
    coreCount = _g === void 0 ? 1 : _g,
    _h = options.energyConfig,
    energyConfig = _h === void 0 ? { activeWatts: 20, idleWatts: 5, switchJoules: 0.1 } : _h;
  var processes = inputProcesses.map(function (p) {
    return __assign(__assign({}, p), { remaining: p.burst });
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
  var q1 = []; // RR (Priority === 1)
  var q2 = []; // FCFS (Priority > 1)
  var pIndex = 0;
  var cores = Array.from({ length: coreCount }, function (_, i) {
    return {
      id: i,
      currentTime: 0,
      lastPid: 'IDLE',
      rrQuantumProgress: 0,
    };
  });
  while (completedCount < totalProcesses) {
    while (pIndex < totalProcesses && processes[pIndex].arrival <= systemTime) {
      var p = processes[pIndex];
      var prio = (_a = p.priority) !== null && _a !== void 0 ? _a : 2;
      if (prio === 1) q1.push(p);
      else q2.push(p);
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
        if (core.currentProcessPid && core.currentProcessPid !== 'CS') {
          var current = processes.find(function (p) {
            return p.pid === core.currentProcessPid;
          });
          var currentPrio = (_b = current.priority) !== null && _b !== void 0 ? _b : 2;
          if (
            currentPrio > 1 &&
            q1.filter(function (p) {
              return !currentlyRunningPids_1.includes(p.pid);
            }).length > 0
          ) {
            core.currentProcessPid = undefined;
          } else if (currentPrio === 1 && core.rrQuantumProgress >= quantum) {
            q1.shift();
            q1.push(current);
            core.rrQuantumProgress = 0;
            core.currentProcessPid = undefined;
          }
        }
        if (!core.currentProcessPid) {
          var currentlyRunningPids_2 = cores
            .filter(function (c) {
              return c.currentProcessPid && c.currentProcessPid !== 'CS';
            })
            .map(function (c) {
              return c.currentProcessPid;
            });
          var availableQ1 = q1.filter(function (p) {
            return !currentlyRunningPids_2.includes(p.pid);
          });
          var availableQ2 = q2.filter(function (p) {
            return !currentlyRunningPids_2.includes(p.pid);
          });
          var selected = void 0;
          if (availableQ1.length > 0) {
            selected = availableQ1[0];
            core.rrQuantumProgress = 0;
          } else if (availableQ2.length > 0) {
            selected = availableQ2[0];
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
    for (var _i = 0, cores_1 = cores; _i < cores_1.length; _i++) {
      var core = cores_1[_i];
      _loop_1(core);
    }
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
                var _a;
                var p = processes.find(function (p) {
                  return p.pid === c.currentProcessPid;
                });
                var timeToComplete = p.remaining;
                var timeToQuantum =
                  ((_a = p.priority) !== null && _a !== void 0 ? _a : 2) === 1
                    ? quantum - c.rrQuantumProgress
                    : Infinity;
                return systemTime + Math.min(timeToComplete, timeToQuantum);
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
          if (lastEvent && lastEvent.pid === p.pid && lastEvent.end === systemTime)
            lastEvent.end = nextEventTime;
          else events.push({ pid: p.pid, start: systemTime, end: nextEventTime, coreId: core.id });
          p.remaining -= duration;
          if (((_c = p.priority) !== null && _c !== void 0 ? _c : 2) === 1)
            core.rrQuantumProgress += duration;
          core.currentTime = nextEventTime;
          core.lastPid = p.pid;
          if (p.remaining <= 0) {
            completedCount++;
            completionTimes[p.pid] = nextEventTime;
            turnaroundTimes[p.pid] = nextEventTime - p.arrival;
            waitingTimes[p.pid] = turnaroundTimes[p.pid] - p.burst;
            core.currentProcessPid = undefined;
            if (((_d = p.priority) !== null && _d !== void 0 ? _d : 2) === 1) q1.shift();
            else q2.shift();
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
      for (var _j = 0, cores_2 = cores; _j < cores_2.length; _j++) {
        var core = cores_2[_j];
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
