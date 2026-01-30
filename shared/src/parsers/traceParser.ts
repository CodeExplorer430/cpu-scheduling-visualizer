import { SimulationResult, GanttEvent, Metrics } from '../types.js';

export interface TraceParser {
  name: string;
  canParse(content: string | ArrayBuffer): boolean;
  parse(content: string | ArrayBuffer): SimulationResult;
}

// 1. Internal JSON Format (Quantix Native)
export const QuantixParser: TraceParser = {
  name: 'Quantix Native (JSON)',
  canParse: (content) => {
    if (typeof content !== 'string') return false;
    try {
      const json = JSON.parse(content);
      return !!(json.events && Array.isArray(json.events) && json.metrics);
    } catch {
      return false;
    }
  },
  parse: (content) => {
    return JSON.parse(content as string) as SimulationResult;
  },
};

// 2. Trace Event Format (Chrome Tracing JSON)
// Docs: https://docs.google.com/document/d/1CvAClvFfyA5R-PhYUmn5OOQtYMH4h6I0nSsKchNAySU/preview
interface TraceEvent {
  name: string; // Event name
  cat: string; // Category
  ph: string; // Phase (B, E, X, etc.)
  ts: number; // Timestamp (microseconds)
  pid: number; // Process ID
  tid: number; // Thread ID
  dur?: number; // Duration (microseconds) for 'X' events
  args?: Record<string, any>;
}

export const TraceEventParser: TraceParser = {
  name: 'Trace Event Format (JSON)',
  canParse: (content) => {
    if (typeof content !== 'string') return false;
    try {
      const json = JSON.parse(content);
      // It can be an object with 'traceEvents' array or just an array
      const events = Array.isArray(json) ? json : json.traceEvents;
      if (!Array.isArray(events)) return false;
      // Check for at least one event with common fields
      return events.some((e: any) => e.ph && e.ts !== undefined && e.pid !== undefined);
    } catch {
      return false;
    }
  },
  parse: (content) => {
    const raw = JSON.parse(content as string);
    const traceEvents: TraceEvent[] = Array.isArray(raw) ? raw : raw.traceEvents;

    const ganttEvents: GanttEvent[] = [];
    const completion: Record<string, number> = {};
    let minTime = Infinity;

    // Filter relevant events (sched_switch or generic thread slices)
    // We assume 'X' (Complete) events or 'B'/'E' pairs represent execution
    // Ideally we look for specific scheduling events if available, but general tracing often uses slices.

    // Group by thread/process
    const openEvents: Record<string, TraceEvent> = {}; // Key: pid-tid

    traceEvents.sort((a, b) => a.ts - b.ts);

    traceEvents.forEach((e) => {
      if (e.ts < minTime) minTime = e.ts;
      const key = `${e.pid}-${e.tid}`;
      const pidName = `P${e.pid}`; // Simplified PID naming

      if (e.ph === 'X') {
        // Complete event
        const start = e.ts;
        const end = e.ts + (e.dur || 0);
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
        const startEvent = openEvents[key];
        if (startEvent) {
          const start = startEvent.ts;
          const end = e.ts;
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
    const scale = minTime > 1000000 ? 1000 : 1; // Basic heuristic
    const normalizedEvents = ganttEvents.map((e) => ({
      ...e,
      start: (e.start - minTime) / scale,
      end: (e.end - minTime) / scale,
    }));

    // Calculate basic metrics from the trace
    const metrics: Metrics = {
      completion: {},
      turnaround: {},
      waiting: {},
      avgTurnaround: 0,
      avgWaiting: 0,
      contextSwitches: normalizedEvents.length,
    };

    return {
      events: normalizedEvents,
      metrics,
    };
  },
};

// 3. Linux ftrace (sched_switch) - Textual
// Format: <task>-<pid> [<cpu>] <flags> <timestamp>: sched_switch: prev_comm=<Prev> prev_pid=<PPID> ... ==> next_comm=<Next> next_pid=<NPID>
export const FtraceParser: TraceParser = {
  name: 'Linux ftrace (sched_switch)',
  canParse: (content) => {
    if (typeof content !== 'string') return false;
    // Look for typical ftrace header or sched_switch lines
    return content.includes('sched_switch:') || content.includes('# tracer:');
  },
  parse: (content) => {
    const lines = (content as string).split('\n');
    const ganttEvents: GanttEvent[] = [];
    const activeTasks: Record<number, { pid: string; start: number }> = {}; // cpu -> current task
    let minTime = Infinity;
    let maxTime = 0;

    // Regex to parse sched_switch line
    // Example: bash-1234 [001] d... 12345.678900: sched_switch: prev_comm=bash prev_pid=1234 ... ==> next_comm=nginx next_pid=5678
    // Matches: [cpu] timestamp prev_pid next_comm next_pid
    // Updated to match task-pid at start
    const regex = /.*?\[(\d+)\]\s+.*?\s+(\d+\.\d+):\s+sched_switch:.*?prev_pid=(\d+).*?==>\s+next_comm=(.*?)\s+next_pid=(\d+)/;

    lines.forEach((line) => {
      const match = line.match(regex);
      if (match) {
        const cpu = parseInt(match[1]);
        const timestamp = parseFloat(match[2]);
        // const prevPid = match[3];
        const nextComm = match[4];
        const nextPid = match[5];

        if (timestamp < minTime) minTime = timestamp;
        if (timestamp > maxTime) maxTime = timestamp;

        // Close previous event on this CPU
        if (activeTasks[cpu]) {
          const { pid, start } = activeTasks[cpu];
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
          pid: nextPid === '0' ? 'IDLE' : `${nextComm}-${nextPid}`,
          start: timestamp,
        };
      }
    });

    // Flush active tasks (assume they end at maxTime found in trace)
    // This handles the last event on each CPU
    Object.entries(activeTasks).forEach(([cpuStr, task]) => {
      const cpu = parseInt(cpuStr);
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
    const normalizedEvents = ganttEvents.map((e) => ({
      ...e,
      start: (e.start - minTime) * 1000, // Seconds to ms usually
      end: (e.end - minTime) * 1000,
    }));

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
export const parseTrace = (content: string | ArrayBuffer): SimulationResult => {
  const parsers = [QuantixParser, TraceEventParser, FtraceParser];
  for (const parser of parsers) {
    if (parser.canParse(content)) {
      console.log(`Using parser: ${parser.name}`);
      return parser.parse(content);
    }
  }
  throw new Error('Unsupported trace format. Please use JSON (Quantix/TraceEvent) or text (ftrace).');
};