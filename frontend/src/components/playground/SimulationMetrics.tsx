import React from 'react';
import { Metrics } from '@cpu-vis/shared';

interface Props {
  metrics: Metrics;
  isFinished: boolean;
}

export const SimulationMetrics: React.FC<Props> = ({ metrics, isFinished }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Final Metrics</h3>
        {!isFinished && <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">Simulation in progress...</span>}
      </div>

      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Avg. Turnaround</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{metrics.avgTurnaround.toFixed(2)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">Avg. Waiting</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{metrics.avgWaiting.toFixed(2)}</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
            <tr>
              <th className="px-6 py-3">PID</th>
              <th className="px-6 py-3">Completion</th>
              <th className="px-6 py-3">Turnaround</th>
              <th className="px-6 py-3">Waiting</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Object.keys(metrics.completion).sort().map(pid => (
              <tr key={pid} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{pid}</td>
                <td className="px-6 py-3">{metrics.completion[pid]}</td>
                <td className="px-6 py-3">{metrics.turnaround[pid]}</td>
                <td className="px-6 py-3">{metrics.waiting[pid]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
