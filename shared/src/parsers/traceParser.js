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
exports.parseTrace =
  exports.FtraceParser =
  exports.TraceEventParser =
  exports.QuantixParser =
    void 0;
// 1. Internal JSON Format (Quantix Native)
exports.QuantixParser = {
  name: 'Quantix Native (JSON)',
  canParse: function (content) {
    if (typeof content !== 'string') return false;
    try {
      var json = JSON.parse(content);
      return !!(json.events && Array.isArray(json.events) && json.metrics);
    } catch (_a) {
      return false;
    }
  },
  parse: function (content) {
    return JSON.parse(content);
  },
};
exports.TraceEventParser = {
  name: 'Trace Event Format (JSON)',
  canParse: function (content) {
    if (typeof content !== 'string') return false;
    try {
      var json = JSON.parse(content);
      // It can be an object with 'traceEvents' array or just an array
      var events = Array.isArray(json) ? json : json.traceEvents;
      if (!Array.isArray(events)) return false;
      // Check for at least one event with common fields
      return events.some(function (e) {
        return e.ph && e.ts !== undefined && e.pid !== undefined;
      });
    } catch (_a) {
      return false;
    }
  },
  parse: function (content) {
    var raw = JSON.parse(content);
    var traceEvents = Array.isArray(raw) ? raw : raw.traceEvents;
    var ganttEvents = [];
    var completion = {};
    var minTime = Infinity;
    // Filter relevant events (sched_switch or generic thread slices)
    // We assume 'X' (Complete) events or 'B'/'E' pairs represent execution
    // Ideally we look for specific scheduling events if available, but general tracing often uses slices.
    // Group by thread/process
    var openEvents = {}; // Key: pid-tid
    traceEvents.sort(function (a, b) {
      return a.ts - b.ts;
    });
    traceEvents.forEach(function (e) {
      if (e.ts < minTime) minTime = e.ts;
      var key = ''.concat(e.pid, '-').concat(e.tid);
      var pidName = 'P'.concat(e.pid); // Simplified PID naming
      if (e.ph === 'X') {
        // Complete event
        var start = e.ts;
        var end = e.ts + (e.dur || 0);
        ganttEvents.push({
          pid: pidName,
          start: start,
          end: end,
          coreId: 0, // Trace events often don't map explicitly to CPU cores without context switch events
        });
        completion[pidName] = Math.max(completion[pidName] || 0, end);
      } else if (e.ph === 'B') {
        openEvents[key] = e;
      } else if (e.ph === 'E') {
        var startEvent = openEvents[key];
        if (startEvent) {
          var start = startEvent.ts;
          var end = e.ts;
          ganttEvents.push({
            pid: pidName,
            start: start,
            end: end,
            coreId: 0,
          });
          completion[pidName] = Math.max(completion[pidName] || 0, end);
          delete openEvents[key];
        }
      }
    });
    // Normalize time to start at 0
    // Convert microseconds to milliseconds (approx) or keep generic units
    // Let's scale down by 1000 for ms if numbers are huge
    var scale = minTime > 1000000 ? 1000 : 1; // Basic heuristic
    var normalizedEvents = ganttEvents.map(function (e) {
      return __assign(__assign({}, e), {
        start: (e.start - minTime) / scale,
        end: (e.end - minTime) / scale,
      });
    });
    // Calculate basic metrics from the trace
    var metrics = {
      completion: {},
      turnaround: {},
      waiting: {},
      avgTurnaround: 0,
      avgWaiting: 0,
      contextSwitches: normalizedEvents.length,
    };
    return {
      events: normalizedEvents,
      metrics: metrics,
    };
  },
};
// 3. Linux ftrace (sched_switch) - Textual
// Format: <task>-<pid> [<cpu>] <flags> <timestamp>: sched_switch: prev_comm=<Prev> prev_pid=<PPID> ... ==> next_comm=<Next> next_pid=<NPID>
exports.FtraceParser = {
  name: 'Linux ftrace (sched_switch)',
  canParse: function (content) {
    if (typeof content !== 'string') return false;
    // Look for typical ftrace header or sched_switch lines
    return content.includes('sched_switch:') || content.includes('# tracer:');
  },
  parse: function (content) {
    var lines = content.split('\n');
    var ganttEvents = [];
    var activeTasks = {}; // cpu -> current task
    var minTime = Infinity;
    var maxTime = 0;
    // Regex to parse sched_switch line
    // Example: bash-1234 [001] d... 12345.678900: sched_switch: prev_comm=bash prev_pid=1234 ... ==> next_comm=nginx next_pid=5678
    // Matches: [cpu] timestamp prev_pid next_comm next_pid
    // Updated to match task-pid at start
    var regex =
      /.*?\[(\d+)\]\s+.*?\s+(\d+\.\d+):\s+sched_switch:.*?prev_pid=(\d+).*?==>\s+next_comm=(.*?)\s+next_pid=(\d+)/;
    lines.forEach(function (line) {
      var match = line.match(regex);
      if (match) {
        var cpu = parseInt(match[1]);
        var timestamp = parseFloat(match[2]);
        // const prevPid = match[3];
        var nextComm = match[4];
        var nextPid = match[5];
        if (timestamp < minTime) minTime = timestamp;
        if (timestamp > maxTime) maxTime = timestamp;
        // Close previous event on this CPU
        if (activeTasks[cpu]) {
          var _a = activeTasks[cpu],
            pid = _a.pid,
            start = _a.start;
          // Only record non-idle tasks (usually pid 0 is swapper/idle)
          if (pid !== '0' && pid !== 'swapper') {
            ganttEvents.push({
              pid: pid, // Using PID as name for uniqueness
              start: start,
              end: timestamp,
              coreId: cpu,
            });
          }
        }
        // Start new event
        // We use nextPid as the identifier
        activeTasks[cpu] = {
          pid: nextPid === '0' ? 'IDLE' : ''.concat(nextComm, '-').concat(nextPid),
          start: timestamp,
        };
      }
    });
    // Flush active tasks (assume they end at maxTime found in trace)
    // This handles the last event on each CPU
    Object.entries(activeTasks).forEach(function (_a) {
      var cpuStr = _a[0],
        task = _a[1];
      var cpu = parseInt(cpuStr);
      if (task.pid !== '0' && task.pid !== 'IDLE' && task.pid !== 'swapper') {
        ganttEvents.push({
          pid: task.pid,
          start: task.start,
          end: maxTime,
          coreId: cpu,
        });
      }
    });
    // Normalize to 0 start
    var normalizedEvents = ganttEvents.map(function (e) {
      return __assign(__assign({}, e), {
        start: (e.start - minTime) * 1000,
        end: (e.end - minTime) * 1000,
      });
    });
    return {
      events: normalizedEvents,
      metrics: {
        completion: {},
        turnaround: {},
        waiting: {},
        avgTurnaround: 0,
        avgWaiting: 0,
        contextSwitches: normalizedEvents.length,
      },
    };
  },
};
// Main parsing function
var parseTrace = function (content) {
  var parsers = [exports.QuantixParser, exports.TraceEventParser, exports.FtraceParser];
  for (var _i = 0, parsers_1 = parsers; _i < parsers_1.length; _i++) {
    var parser = parsers_1[_i];
    if (parser.canParse(content)) {
      console.log('Using parser: '.concat(parser.name));
      return parser.parse(content);
    }
  }
  throw new Error(
    'Unsupported trace format. Please use JSON (Quantix/TraceEvent) or text (ftrace).'
  );
};
exports.parseTrace = parseTrace;
