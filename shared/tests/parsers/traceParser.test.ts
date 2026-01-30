import { describe, it, expect } from 'vitest';
import {
  parseTrace,
  QuantixParser,
  TraceEventParser,
  FtraceParser,
} from '../../src/parsers/traceParser.js';

describe('Trace Parsers', () => {
  describe('QuantixParser (Native JSON)', () => {
    const validJson = JSON.stringify({
      events: [{ pid: 'P1', start: 0, end: 5 }],
      metrics: { avgWaiting: 0 },
    });

    it('should detect valid native JSON', () => {
      expect(QuantixParser.canParse(validJson)).toBe(true);
    });

    it('should parse native JSON correctly', () => {
      const result = QuantixParser.parse(validJson);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].pid).toBe('P1');
    });

    it('should reject invalid JSON', () => {
      expect(QuantixParser.canParse('invalid')).toBe(false);
      expect(QuantixParser.canParse('{}')).toBe(false); // Missing events/metrics
    });
  });

  describe('TraceEventParser (Chrome/Perfetto)', () => {
    const traceEvents = JSON.stringify([
      { name: 'TaskA', cat: 't', ph: 'X', ts: 1000, pid: 1, tid: 1, dur: 500 },
      { name: 'TaskB', cat: 't', ph: 'X', ts: 2000, pid: 2, tid: 1, dur: 300 },
    ]);

    const objectFormat = JSON.stringify({
      traceEvents: JSON.parse(traceEvents),
    });

    it('should detect array format', () => {
      expect(TraceEventParser.canParse(traceEvents)).toBe(true);
    });

    it('should detect object format', () => {
      expect(TraceEventParser.canParse(objectFormat)).toBe(true);
    });

    it('should parse X (Complete) events', () => {
      const result = TraceEventParser.parse(traceEvents);
      expect(result.events).toHaveLength(2);
      // Normalized time: 1000 start -> 0
      expect(result.events[0].pid).toBe('P1');
      expect(result.events[0].start).toBe(0);
      expect(result.events[0].end).toBe(500); // 1000+500 - 1000
    });

    it('should handle B/E (Begin/End) events', () => {
      const beEvents = JSON.stringify([
        { ph: 'B', ts: 1000, pid: 1, tid: 1 },
        { ph: 'E', ts: 1500, pid: 1, tid: 1 },
      ]);
      const result = TraceEventParser.parse(beEvents);
      expect(result.events).toHaveLength(1);
      expect(result.events[0].end).toBe(500);
    });
  });

  describe('FtraceParser (Linux sched_switch)', () => {
    const ftraceLog = `
# tracer: function
#
# entries-in-buffer/entries-written: 4/4   #P:4
#
#                              _-----=> irqs-off
#                             / _----=> need-resched
#                            | / _---=> hardirq/softirq
#                            || / _--=> preempt-depth
#                            ||| /     delay
#           TASK-PID   CPU#  ||||    TIMESTAMP  FUNCTION
#              | |       |   ||||       |         |
          <idle>-0     [000] d... 12345.000000: sched_switch: prev_comm=swapper/0 prev_pid=0 prev_prio=120 prev_state=R ==> next_comm=bash next_pid=1001 next_prio=120
            bash-1001  [000] d... 12345.005000: sched_switch: prev_comm=bash prev_pid=1001 prev_prio=120 prev_state=R ==> next_comm=nginx next_pid=1002 next_prio=120
           nginx-1002  [000] d... 12345.010000: sched_switch: prev_comm=nginx prev_pid=1002 prev_prio=120 prev_state=S ==> next_comm=swapper/0 next_pid=0 next_prio=120
    `;

    it('should detect ftrace content', () => {
      expect(FtraceParser.canParse(ftraceLog)).toBe(true);
    });

    it('should parse sched_switch events', () => {
      const result = FtraceParser.parse(ftraceLog);
      // Expected events:
      // 1. bash-1001 starts at 12345.000 (switch from idle)
      // 2. bash-1001 ends at 12345.005 (switch to nginx) -> Event 1: dur 5ms
      // 3. nginx-1002 ends at 12345.010 (switch to idle) -> Event 2: dur 5ms

      // Note: The parser logic records an event when it *closes* (next switch on same CPU)
      // So line 1 starts bash. Line 2 closes bash, starts nginx. Line 3 closes nginx, starts idle.

      expect(result.events.length).toBeGreaterThanOrEqual(2);

      const bashEvent = result.events.find((e) => e.pid === 'bash-1001');
      const nginxEvent = result.events.find((e) => e.pid === 'nginx-1002');

      expect(bashEvent).toBeDefined();
      expect(nginxEvent).toBeDefined();

      // Check durations (approximate due to floating point and normalization)
      // bash: 0.005 - 0.000 = 0.005s = 5ms
      expect(bashEvent?.end).toBeCloseTo(5, 1);
    });
  });

  describe('Main parseTrace function', () => {
    it('should auto-detect and parse JSON', () => {
      const json = JSON.stringify({ events: [], metrics: {} });
      const result = parseTrace(json);
      expect(result).toBeDefined();
    });

    it('should throw on unknown format', () => {
      expect(() => parseTrace('Just some random text')).toThrow();
    });
  });
});
