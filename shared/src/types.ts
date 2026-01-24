export interface Process {
  pid: string;
  arrival: number; // integer (time units)
  burst: number; // integer (time units)
  remaining?: number; // used for preemptive algorithms
  priority?: number; // lower => higher priority (configurable)
  color?: string; // For UI visualization
}

export interface GanttEvent {
  pid: string | 'IDLE' | 'CS'; // CS = Context Switch
  start: number;
  end: number;
}

export interface Metrics {
  completion: Record<string, number>; // pid -> completion time
  turnaround: Record<string, number>;
  waiting: Record<string, number>;
  avgTurnaround: number;
  avgWaiting: number;
  contextSwitches?: number;
}

export type Algorithm = 'FCFS' | 'SJF' | 'SRTF' | 'RR' | 'PRIORITY';

export interface Snapshot {
  time: number;
  runningPid: string | 'IDLE' | 'CS';
  readyQueue: string[];
}

export interface SimulationResult {
  events: GanttEvent[];
  metrics: Metrics;
  snapshots?: Snapshot[];
  logs?: string[]; // step-by-step explanations
}

export interface SimulationOptions {
  quantum?: number;
  contextSwitchOverhead?: number;
  enableLogging?: boolean;
}
