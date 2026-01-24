import React, { useState, useEffect, useCallback } from 'react';
import { runFCFS, runSJF, runSRTF, runRR, Process, SimulationResult, Algorithm } from '@cpu-vis/shared';
import { ProcessTable } from '../components/ProcessTable';
import { Gantt } from '../components/GanttChart/Gantt';
import { Stepper } from '../components/Stepper';

interface Props {
  processes: Process[];
  onProcessesChange: (p: Process[]) => void;
}

export const Playground: React.FC<Props> = ({ processes, onProcessesChange }) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('FCFS');
  const [quantum, setQuantum] = useState<number>(2);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  
  // Step-through state
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleRunSimulation = useCallback(() => {
    let result: SimulationResult;
    
    switch (selectedAlgorithm) {
      case 'FCFS':
        result = runFCFS(processes);
        break;
      case 'SJF':
        result = runSJF(processes);
        break;
      case 'SRTF':
        result = runSRTF(processes);
        break;
      case 'RR':
        result = runRR(processes, quantum);
        break;
      default:
        result = runFCFS(processes);
    }
    
    setSimulationResult(result);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [processes, selectedAlgorithm, quantum]);

  // Auto-play logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && simulationResult) {
      const maxTime = simulationResult.events.length > 0 
        ? simulationResult.events[simulationResult.events.length - 1].end 
        : 0;
      
      if (currentTime < maxTime) {
        interval = setInterval(() => {
          setCurrentTime(prev => prev + 1);
        }, 1000); // 1 second per time unit
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, simulationResult]);

  const metrics = simulationResult?.metrics;
  const currentSnapshot = simulationResult?.snapshots?.find(s => s.time === currentTime);
  const maxTime = simulationResult?.events.length ? simulationResult.events[simulationResult.events.length - 1].end : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Left Column: Controls & Input */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Controls */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Algorithm</label>
            <select
              value={selectedAlgorithm}
              onChange={(e) => setSelectedAlgorithm(e.target.value as Algorithm)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
            >
              <option value="FCFS">First-Come, First-Served (FCFS)</option>
              <option value="SJF">Shortest Job First (SJF - Non-Preemptive)</option>
              <option value="SRTF">Shortest Remaining Time First (SRTF - Preemptive)</option>
              <option value="RR">Round Robin (RR)</option>
            </select>
          </div>

          {selectedAlgorithm === 'RR' && (
              <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Quantum</label>
              <input
                type="number"
                min="1"
                value={quantum}
                onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border"
              />
            </div>
          )}
          
          <button
            onClick={handleRunSimulation}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm"
          >
            Run Simulation
          </button>
        </div>

        {/* Stepper */}
        {simulationResult && (
          <Stepper 
            currentTime={currentTime} 
            maxTime={maxTime} 
            onTimeChange={setCurrentTime}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        )}

        {/* Process Input Table */}
        <ProcessTable processes={processes} onProcessChange={onProcessesChange} />
      </div>

      {/* Right Column: Visualization & Metrics */}
      <div className="lg:col-span-7 space-y-6">
        
        {/* Real-time State */}
        {simulationResult && (
           <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500 flex justify-between items-center">
              <div>
                 <p className="text-xs font-bold text-gray-400 uppercase">Currently Running</p>
                 <p className="text-2xl font-bold text-gray-800">{currentSnapshot?.runningPid || (currentTime >= maxTime ? 'FINISHED' : 'IDLE')}</p>
              </div>
              <div className="text-right">
                 <p className="text-xs font-bold text-gray-400 uppercase">Ready Queue</p>
                 <div className="flex space-x-1 mt-1">
                    {currentSnapshot?.readyQueue.map(pid => (
                      <span key={pid} className="bg-blue-100 text-blue-800 text-xs font-bold px-2 py-1 rounded border border-blue-200">{pid}</span>
                    ))}
                    {(!currentSnapshot?.readyQueue.length) && <span className="text-gray-300 text-sm italic">Empty</span>}
                 </div>
              </div>
           </div>
        )}

        {/* Gantt Chart */}
        {simulationResult ? (
          <Gantt events={simulationResult.events} currentTime={currentTime} />
        ) : (
          <div className="h-40 bg-white rounded-lg shadow flex items-center justify-center text-gray-400">
            Run simulation to see Gantt Chart
          </div>
        )}

        {/* Metrics (Only show final metrics if completed or just show anyway) */}
        {metrics && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-700">Final Metrics</h3>
              {currentTime < maxTime && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">Simulation in progress...</span>}
            </div>
            {/* ... rest of metrics table same as before ... */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50">
              <div className="bg-white p-4 rounded shadow-sm border border-gray-100 text-center">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Avg. Turnaround Time</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{metrics.avgTurnaround.toFixed(2)}</p>
              </div>
              <div className="bg-white p-4 rounded shadow-sm border border-gray-100 text-center">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Avg. Waiting Time</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{metrics.avgWaiting.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3">PID</th>
                    <th className="px-6 py-3">Completion</th>
                    <th className="px-6 py-3">Turnaround</th>
                    <th className="px-6 py-3">Waiting</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {Object.keys(metrics.completion).sort().map(pid => (
                    <tr key={pid} className="bg-white">
                      <td className="px-6 py-3 font-medium text-gray-900">{pid}</td>
                      <td className="px-6 py-3 text-gray-500">{metrics.completion[pid]}</td>
                      <td className="px-6 py-3 text-gray-500">{metrics.turnaround[pid]}</td>
                      <td className="px-6 py-3 text-gray-500">{metrics.waiting[pid]}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};