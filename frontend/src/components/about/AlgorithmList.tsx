import React from 'react';
import { Card } from '../common/Card';

export const AlgorithmList: React.FC = () => {
  const algorithms = [
    'First-Come, First-Served (FCFS)',
    'Shortest Job First (SJF)',
    'Shortest Remaining Time First (SRTF)',
    'Round Robin (RR)',
    'Priority (Preemptive & Non-Preemptive)',
    'Longest Job First (LJF)',
    'Longest Remaining Time First (LRTF)',
    'Highest Response Ratio Next (HRRN)',
    'Multilevel Queue (MLQ)',
    'Multilevel Feedback Queue (MLFQ)',
    'Fair-Share Scheduling',
    'Lottery Scheduling',
    'Earliest Deadline First (EDF)',
    'Rate-Monotonic Scheduling (RMS)',
  ];

  return (
    <Card>
      <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Supported Algorithms</h3>
      <div className="flex flex-wrap gap-2">
        {algorithms.map((algo) => (
          <span
            key={algo}
            className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
          >
            {algo}
          </span>
        ))}
      </div>
    </Card>
  );
};
