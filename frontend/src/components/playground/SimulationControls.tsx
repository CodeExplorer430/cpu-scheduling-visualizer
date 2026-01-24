import React from 'react';
import { Algorithm } from '@cpu-vis/shared';

interface Props {
  selectedAlgorithm: Algorithm;
  setSelectedAlgorithm: (algo: Algorithm) => void;
  quantum: number;
  setQuantum: (q: number) => void;
  onRun: () => void;
}

export const SimulationControls: React.FC<Props> = ({
  selectedAlgorithm,
  setSelectedAlgorithm,
  quantum,
  setQuantum,
  onRun,
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4 transition-colors duration-200">
      <div>
        <label
          htmlFor="algorithm-select"
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          Algorithm
        </label>
        <select
          id="algorithm-select"
          value={selectedAlgorithm}
          onChange={(e) => setSelectedAlgorithm(e.target.value as Algorithm)}
          className="w-full bg-white text-gray-900 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border transition-colors"
        >
          <option value="FCFS">First-Come, First-Served (FCFS)</option>
          <option value="SJF">Shortest Job First (SJF - Non-Preemptive)</option>
          <option value="SRTF">Shortest Remaining Time First (SRTF - Preemptive)</option>
          <option value="RR">Round Robin (RR)</option>
        </select>
      </div>

      {selectedAlgorithm === 'RR' && (
        <div>
          <label
            htmlFor="quantum-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            Time Quantum
          </label>
          <input
            id="quantum-input"
            type="number"
            min="1"
            value={quantum}
            onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-white text-gray-900 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border transition-colors"
          />
        </div>
      )}

      <button
        onClick={onRun}
        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm"
      >
        Run Simulation
      </button>
    </div>
  );
};
