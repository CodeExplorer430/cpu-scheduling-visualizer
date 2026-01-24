import { Process } from './types.js';

export interface RandomConfig {
  count: number;
  arrivalRange: [number, number];
  burstRange: [number, number];
}

export function generateRandomProcesses(config: RandomConfig): Process[] {
  const processes: Process[] = [];
  for (let i = 0; i < config.count; i++) {
    const arrival =
      Math.floor(Math.random() * (config.arrivalRange[1] - config.arrivalRange[0] + 1)) +
      config.arrivalRange[0];
    const burst =
      Math.floor(Math.random() * (config.burstRange[1] - config.burstRange[0] + 1)) +
      config.burstRange[0];

    processes.push({
      pid: `P${i + 1}`,
      arrival,
      burst,
      color: getRandomColor(),
    });
  }
  // Sort by arrival for convenience, though not strictly required
  return processes.sort((a, b) => a.arrival - b.arrival);
}

function getRandomColor(): string {
  const colors = [
    '#3b82f6',
    '#ef4444',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ec4899',
    '#6366f1',
    '#14b8a6',
    '#f97316',
    '#84cc16',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export function exportToCSV(processes: Process[]): string {
  const header = 'PID,Arrival,Burst,Priority';
  const rows = processes.map((p) => {
    return `${p.pid},${p.arrival},${p.burst},${p.priority || ''}`;
  });
  return [header, ...rows].join('\n');
}

export function parseCSV(csvContent: string): Process[] {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) return [];

  // Assume header is first line, skip it
  const processes: Process[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const [pid, arrivalStr, burstStr, priorityStr] = line.split(',');
    const arrival = parseInt(arrivalStr, 10);
    const burst = parseInt(burstStr, 10);
    const priority = priorityStr ? parseInt(priorityStr, 10) : undefined;

    if (isNaN(arrival) || isNaN(burst)) {
      console.warn(`Skipping invalid CSV line: ${line}`);
      continue;
    }

    processes.push({
      pid: pid.trim(),
      arrival,
      burst,
      priority,
      color: getRandomColor(),
    });
  }
  return processes;
}
