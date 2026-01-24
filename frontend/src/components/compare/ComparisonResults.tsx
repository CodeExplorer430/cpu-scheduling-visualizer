import React from 'react';
import { SimulationResult, Algorithm } from '@cpu-vis/shared';
import { Gantt } from '../GanttChart/Gantt';

interface Props {
  results: Record<Algorithm, SimulationResult>;
  algorithms: Algorithm[];
}

export const ComparisonResults: React.FC<Props> = ({ results, algorithms }) => {
  return (
    <div className="space-y-8">
      {/* Metrics Comparison Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Metrics Comparison</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-medium">
              <tr>
                <th className="px-6 py-3">Algorithm</th>
                <th className="px-6 py-3">Avg Turnaround</th>
                <th className="px-6 py-3">Avg Waiting</th>
                <th className="px-6 py-3">Context Switches</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {algorithms.map(algo => (
                <tr key={algo} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-3 font-bold text-gray-900 dark:text-white">{algo}</td>
                  <td className="px-6 py-3">{results[algo].metrics.avgTurnaround.toFixed(2)}</td>
                  <td className="px-6 py-3">{results[algo].metrics.avgWaiting.toFixed(2)}</td>
                  <td className="px-6 py-3">{results[algo].metrics.contextSwitches ?? 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Gantt Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {algorithms.map(algo => (
          <div key={algo} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow transition-colors duration-200">
            <h4 className="text-md font-bold mb-2 text-gray-700 dark:text-gray-200">{algo}</h4>
            <Gantt events={results[algo].events} />
          </div>
        ))}
      </div>
    </div>
  );
};
