import { useState } from 'react';
import { runFCFS, Process, SimulationResult } from '@cpu-vis/shared';

const initialProcesses: Process[] = [
  { pid: 'P1', arrival: 0, burst: 5 },
  { pid: 'P2', arrival: 2, burst: 3 },
  { pid: 'P3', arrival: 4, burst: 1 },
];

function App() {
  const [results, setResults] = useState<SimulationResult | null>(null);

  const handleRunSimulation = () => {
    const output = runFCFS(initialProcesses);
    setResults(output);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow-md">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">CPU Scheduling Visualizer</h1>
        
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-2">Input Processes</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto text-sm">
            {JSON.stringify(initialProcesses, null, 2)}
          </pre>
        </div>

        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded transition-colors mb-6"
          onClick={handleRunSimulation}
        >
          Run FCFS
        </button>

        {results && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Gantt Events</h2>
              <div className="flex w-full h-16 bg-gray-200 rounded overflow-hidden">
                {results.events.map((event, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-center text-white text-xs font-bold border-r border-white last:border-0 ${
                      event.pid === 'IDLE' ? 'bg-gray-400 text-gray-800' : 'bg-blue-500'
                    }`}
                    style={{ flex: event.end - event.start }}
                    title={`${event.pid}: ${event.start} - ${event.end}`}
                  >
                    {event.pid} ({event.end - event.start})
                  </div>
                ))}
              </div>
              <pre className="mt-2 bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(results.events, null, 2)}
              </pre>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-2">Metrics</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded">
                  <p className="font-bold text-blue-800">Avg Turnaround Time</p>
                  <p className="text-2xl">{results.metrics.avgTurnaround.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded">
                  <p className="font-bold text-green-800">Avg Waiting Time</p>
                  <p className="text-2xl">{results.metrics.avgWaiting.toFixed(2)}</p>
                </div>
              </div>
              <pre className="mt-2 bg-gray-100 p-4 rounded overflow-auto text-sm">
                {JSON.stringify(results.metrics, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;