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
  coreId?: number; // Default 0 for single core
}

export interface EnergyConfig {
  activeWatts: number; // e.g., 20W
  idleWatts: number; // e.g., 5W
  switchJoules: number; // e.g., 0.1J per switch
}

export interface EnergyMetrics {
  totalEnergy: number;
  activeEnergy: number;
  idleEnergy: number;
  switchEnergy: number;
}

export interface Metrics {
  completion: Record<string, number>; // pid -> completion time
  turnaround: Record<string, number>;
  waiting: Record<string, number>;
  avgTurnaround: number;
  avgWaiting: number;
  contextSwitches?: number;
  cpuUtilization?: number; // 0-100%
  energy?: EnergyMetrics;
}

export type Algorithm = 'FCFS' | 'SJF' | 'LJF' | 'SRTF' | 'RR' | 'PRIORITY';

export interface Snapshot {
  time: number;
  runningPid: (string | 'IDLE' | 'CS')[]; // Array for multi-core
  readyQueue: string[];
}

export interface DecisionLog {
  time: number;
  coreId: number;
  message: string; // Human readable event "Scheduled P1"
  reason: string; // Explanation "Shortest Job in queue (3 < 5)"
  queueState: string[]; // PIDs in queue considered
}

export interface SimulationResult {
  events: GanttEvent[];
  metrics: Metrics;
  snapshots?: Snapshot[];
  logs?: string[]; // step-by-step explanations
  stepLogs?: DecisionLog[]; // Structured decision logs
}

export interface SimulationOptions {
  quantum?: number;
  contextSwitchOverhead?: number;
  enableLogging?: boolean;
  coreCount?: number;
  energyConfig?: EnergyConfig;
}
