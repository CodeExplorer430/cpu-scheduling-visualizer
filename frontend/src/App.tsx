import { useState } from 'react';
import { runFCFS, runSJF, Process, SimulationResult, Algorithm } from '@cpu-vis/shared';
import { ProcessTable } from './components/ProcessTable';
import { Gantt } from './components/GanttChart/Gantt';

const initialProcesses: Process[] = [
  { pid: 'P1', arrival: 0, burst: 4 },
  { pid: 'P2', arrival: 1, burst: 3 },
  { pid: 'P3', arrival: 2, burst: 1 },
  { pid: 'P4', arrival: 5, burst: 2 },
];

function App() {
  const [processes, setProcesses] = useState<Process[]>(initialProcesses);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('FCFS');
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

  const handleRunSimulation = () => {
    let result: SimulationResult;
    
    switch (selectedAlgorithm) {
      case 'FCFS':
        result = runFCFS(processes);
        break;
      case 'SJF':
        result = runSJF(processes);
        break;
      default:
        // Fallback or not implemented
        result = runFCFS(processes);
    }
    
    setSimulationResult(result);
  };

  // Run simulation automatically when inputs change (optional, but nice for interactivity)
  // useEffect(() => { handleRunSimulation() }, [processes, selectedAlgorithm]);

  const metrics = simulationResult?.metrics;

  return (
    <div className="min-h-screen bg-gray-100 p-8 font-sans">
      <header className="max-w-6xl mx-auto mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">CPU Scheduling Visualizer</h1>
        <p className="text-gray-500 mt-2">Interactive simulation of CPU scheduling algorithms.</p>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
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
                {/* <option value="SRTF" disabled>Shortest Remaining Time First (Coming Soon)</option> */}
                {/* <option value="RR" disabled>Round Robin (Coming Soon)</option> */}
              </select>
            </div>
            
            <button
              onClick={handleRunSimulation}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm"
            >
              Run Simulation
            </button>
          </div>

          {/* Process Input Table */}
          <ProcessTable processes={processes} onProcessChange={setProcesses} />
        </div>

        {/* Right Column: Visualization & Metrics */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Gantt Chart */}
          {simulationResult ? (
            <Gantt events={simulationResult.events} />
          ) : (
            <div className="h-40 bg-white rounded-lg shadow flex items-center justify-center text-gray-400">
              Run simulation to see Gantt Chart
            </div>
          )}

          {/* Metrics */}
          {metrics && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-700">Metrics</h3>
              </div>
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
      </main>
    </div>
  );
}

export default App;
