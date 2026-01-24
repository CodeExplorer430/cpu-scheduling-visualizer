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
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700">Processes</h3>
        <button
          onClick={addProcess}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-medium transition-colors"
        >
          + Add Process
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Arrival Time</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Burst Time</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {processes.map((process, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="text"
                    value={process.pid}
                    onChange={(e) => updateProcess(index, 'pid', e.target.value)}
                    className="border-gray-300 border rounded px-2 py-1 w-20 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="0"
                    value={process.arrival}
                    onChange={(e) => updateProcess(index, 'arrival', parseInt(e.target.value) || 0)}
                    className="border-gray-300 border rounded px-2 py-1 w-24 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    type="number"
                    min="1"
                    value={process.burst}
                    onChange={(e) => updateProcess(index, 'burst', parseInt(e.target.value) || 1)}
                    className="border-gray-300 border rounded px-2 py-1 w-24 text-sm focus:ring-blue-500 focus:border-blue-500"
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => removeProcess(index)}
                    className="text-red-600 hover:text-red-900"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {processes.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-gray-500 text-sm">
                  No processes added. Click "Add Process" to start.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
