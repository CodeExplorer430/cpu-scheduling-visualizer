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
  args?: Record<string, unknown>;
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
      return (events as TraceEvent[]).some(
        (e) => e.ph && e.ts !== undefined && e.pid !== undefined
      );
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
      response: {},
      avgTurnaround: 0,
      avgWaiting: 0,
      avgResponse: 0,
      p95Turnaround: 0,
      p95Waiting: 0,
      p95Response: 0,
      stdDevTurnaround: 0,
      stdDevWaiting: 0,
      stdDevResponse: 0,
      contextSwitches: normalizedEvents.length,
    };

    return {
      events: normalizedEvents,
      metrics,
    };
  },
};

// 3. Linux ftrace (sched_switch) - Robust Textual Parser
export const FtraceParser: TraceParser = {
  name: 'Linux ftrace (sched_switch)',
  canParse: (content) => {
    if (typeof content !== 'string') return false;
    return content.includes('sched_switch:') || content.includes('# tracer:');
  },
  parse: (content) => {
    const lines = (content as string).split('\n');
    const ganttEvents: GanttEvent[] = [];
    const activeTasks: Record<number, { pid: string; start: number }> = {}; // cpu -> current task
    let minTime = Infinity;
    let maxTime = 0;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      // Look for "sched_switch:" marker
      const switchIndex = trimmed.indexOf('sched_switch:');
      if (switchIndex === -1) continue;

      // Split into metadata (left) and arguments (right)
      const metadataPart = trimmed.substring(0, switchIndex);
      const argsPart = trimmed.substring(switchIndex + 13); // 13 = length of "sched_switch:"

      // Parse Metadata: <task>-<pid> [<cpu>] <flags> <timestamp>:
      // We need timestamp and cpu.
      // Typical format: "bash-1234 [001] d... 12345.678900:"
      // We can just split by space and look for timestamp (ends with :) and cpu (in brackets)
      
      const metaTokens = metadataPart.trim().split(/\s+/);
      let timestamp = 0;
      let cpu = 0;
      
      // Find timestamp: usually the last token ending with ":"
      const tsToken = metaTokens[metaTokens.length - 1];
      if (tsToken && tsToken.endsWith(':')) {
          timestamp = parseFloat(tsToken.slice(0, -1));
      } else {
          // Fallback check
          continue;
      }

      // Find CPU: token matching [001]
      const cpuToken = metaTokens.find(t => t.startsWith('[') && t.endsWith(']'));
      if (cpuToken) {
          cpu = parseInt(cpuToken.slice(1, -1), 10);
      }

      if (isNaN(timestamp) || isNaN(cpu)) continue;

      if (timestamp < minTime) minTime = timestamp;
      if (timestamp > maxTime) maxTime = timestamp;

      // Parse Arguments: prev_comm=bash prev_pid=1234 ... ==> next_comm=nginx next_pid=5678
      // We want next_comm and next_pid.
      // We can split by spaces and look for "key=value"
      
      const argsTokens = argsPart.trim().split(/\s+/);
      let nextComm = '';
      let nextPid = '';

      for (const token of argsTokens) {
          if (token.startsWith('next_comm=')) {
              nextComm = token.split('=')[1];
          } else if (token.startsWith('next_pid=')) {
              nextPid = token.split('=')[1];
          }
      }

      // Close previous event on this CPU
      if (activeTasks[cpu]) {
        const { pid, start } = activeTasks[cpu];
        // Only record non-idle tasks
        if (pid !== '0' && pid !== 'swapper') {
          ganttEvents.push({
            pid: pid,
            start: start,
            end: timestamp,
            coreId: cpu,
          });
        }
      }

      // Start new event
      // next_pid=0 usually means idle/swapper
      activeTasks[cpu] = {
        pid: nextPid === '0' ? 'IDLE' : `${nextComm}-${nextPid}`,
        start: timestamp,
      };
    }

    // Flush active tasks
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

    // Normalize to 0 start, convert seconds to ms
    const normalizedEvents = ganttEvents.map((e) => ({
      ...e,
      start: (e.start - minTime) * 1000,
      end: (e.end - minTime) * 1000,
    }));

    return {
      events: normalizedEvents,
      metrics: {
        completion: {},
        turnaround: {},
        waiting: {},
        response: {},
        avgTurnaround: 0,
        avgWaiting: 0,
        avgResponse: 0,
        p95Turnaround: 0,
        p95Waiting: 0,
        p95Response: 0,
        stdDevTurnaround: 0,
        stdDevWaiting: 0,
        stdDevResponse: 0,
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
  throw new Error(
    'Unsupported trace format. Please use JSON (Quantix/TraceEvent) or text (ftrace).'
  );
};
