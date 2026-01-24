import React from 'react';
import { Process } from '@cpu-vis/shared';

interface Props {
  processes: Process[];
  onProcessChange: (processes: Process[]) => void;
}

export const ProcessTable: React.FC<Props> = ({ processes, onProcessChange }) => {
  const addProcess = () => {
    const newPid = `P${processes.length + 1}`;
    onProcessChange([
      ...processes,
      { pid: newPid, arrival: 0, burst: 1, color: '#3b82f6' }
    ]);
  };

  const updateProcess = (index: number, field: keyof Process, value: string | number) => {
    const updated = [...processes];
    updated[index] = { ...updated[index], [field]: value };
    onProcessChange(updated);
  };

  const removeProcess = (index: number) => {
    const updated = processes.filter((_, i) => i !== index);
    onProcessChange(updated);
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden transition-colors duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Processes</h3>
        <button
          onClick={addProcess}
          className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          + Add
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">PID</th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Arrival</th>
              <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Burst</th>
              <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {processes.map((process, index) => (
              <tr key={index}>
                <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={process.pid}
                    onChange={(e) => updateProcess(index, 'pid', e.target.value)}
                    className="bg-white text-gray-900 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white border rounded px-2 py-1 w-16 sm:w-full max-w-[5rem] text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </td>
                <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    value={process.arrival}
                    onChange={(e) => updateProcess(index, 'arrival', parseInt(e.target.value) || 0)}
                    className="bg-white text-gray-900 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white border rounded px-2 py-1 w-20 sm:w-full max-w-[6rem] text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </td>
                <td className="px-3 sm:px-4 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="1"
                    value={process.burst}
                    onChange={(e) => updateProcess(index, 'burst', parseInt(e.target.value) || 1)}
                    className="bg-white text-gray-900 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white border rounded px-2 py-1 w-20 sm:w-full max-w-[6rem] text-sm focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  />
                </td>
                <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => removeProcess(index)}
                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {processes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  No processes added.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};