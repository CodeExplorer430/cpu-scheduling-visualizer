import React, { useState } from 'react';
import { runFCFS, runSJF, runSRTF, runRR, Process, SimulationResult, Algorithm } from '@cpu-vis/shared';
import { Gantt } from '../components/GanttChart/Gantt';
import { ProcessTable } from '../components/ProcessTable';

interface Props {
  processes: Process[];
  onProcessesChange: (p: Process[]) => void;
}

export const Compare: React.FC<Props> = ({ processes, onProcessesChange }) => {
  const [quantum, setQuantum] = useState<number>(2);
  const [results, setResults] = useState<Record<Algorithm, SimulationResult> | null>(null);

  const handleRunComparison = () => {
    setResults({
      FCFS: runFCFS(processes),
      SJF: runSJF(processes),
      SRTF: runSRTF(processes),
      RR: runRR(processes, quantum),
      // Algorithm = 'FCFS' | 'SJF' | 'SRTF' | 'RR' | 'PRIORITY'
      PRIORITY: runFCFS(processes) // Placeholder
    });
  };

  const algorithms: Algorithm[] = ['FCFS', 'SJF', 'SRTF', 'RR'];

  return (
    <div className="space-y-8">
       {/* Top: Controls & Input */}
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
           <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Comparison Settings</h2>
           <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4 transition-colors duration-200">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Round Robin Quantum</label>
                <input
                  type="number"
                  min="1"
                  value={quantum}
                  onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border transition-colors"
                />
              </div>
              <button
                onClick={handleRunComparison}
                className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm"
              >
                Run Comparison
              </button>
           </div>
        </div>
        
        <div className="overflow-auto max-h-96">
           <ProcessTable processes={processes} onProcessChange={onProcessesChange} />
        </div>
       </div>

       {/* Results */}
       {results && (
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
       )}
    </div>
  );
};