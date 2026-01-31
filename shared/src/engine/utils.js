'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
exports.generateSnapshots = generateSnapshots;
function generateSnapshots(events, processes, coreCount) {
  if (coreCount === void 0) {
    coreCount = 1;
  }
  if (events.length === 0) return [];
  var maxTime = events[events.length - 1].end;
  var snapshots = [];
  var _loop_1 = function (t) {
    // 1. Who is running on each core?
    var runningPids = [];
    var _loop_2 = function (c) {
      // Find event active at time t on core c
      // Note: single-core legacy events might not have coreId set (undefined). Treat as 0.
      var currentEvent = events.find(function (e) {
        var _a;
        var eCore = (_a = e.coreId) !== null && _a !== void 0 ? _a : 0;
        return eCore === c && t >= e.start && t < e.end;
      });
      runningPids.push(currentEvent ? currentEvent.pid : 'IDLE');
    };
    for (var c = 0; c < coreCount; c++) {
      _loop_2(c);
    }
    // 2. Who is ready?
    // Not running on ANY core
    // Arrived
    // Not finished
    // Calculate completion times
    var completionTimes = {};
    processes.forEach(function (p) {
      var pEvents = events.filter(function (e) {
        return e.pid === p.pid;
      });
      if (pEvents.length > 0) {
        // Max end time across all events for this process
        completionTimes[p.pid] = Math.max.apply(
          Math,
          pEvents.map(function (e) {
            return e.end;
          })
        );
      } else {
        completionTimes[p.pid] = -1;
      }
    });
    var readyQueue = processes
      .filter(function (p) {
        if (runningPids.includes(p.pid)) return false; // Running on some core
        if (p.arrival > t) return false; // Hasn't arrived
        if (completionTimes[p.pid] <= t && completionTimes[p.pid] !== -1) return false; // Done
        return true;
      })
      .map(function (p) {
        return p.pid;
      });
    snapshots.push({
      time: t,
      runningPid: runningPids,
      readyQueue: readyQueue,
    });
  };
  for (var t = 0; t < maxTime; t++) {
    _loop_1(t);
  }
  // Final snapshot
  snapshots.push({
    time: maxTime,
    runningPid: Array(coreCount).fill('IDLE'),
    readyQueue: [],
  });
  return snapshots;
}
