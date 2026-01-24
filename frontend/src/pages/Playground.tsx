import React, { useState, useEffect, useCallback } from 'react';
import { runFCFS, runSJF, runSRTF, runRR, Process, SimulationResult, Algorithm } from '@cpu-vis/shared';
import { ProcessTable } from '../components/ProcessTable';
import { Gantt } from '../components/GanttChart/Gantt';
import { Stepper } from '../components/Stepper';
import { SimulationControls } from '../components/playground/SimulationControls';
import { RealTimeStatus } from '../components/playground/RealTimeStatus';
import { SimulationMetrics } from '../components/playground/SimulationMetrics';

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
        
        <SimulationControls 
          selectedAlgorithm={selectedAlgorithm}
          setSelectedAlgorithm={setSelectedAlgorithm}
          quantum={quantum}
          setQuantum={setQuantum}
          onRun={handleRunSimulation}
        />

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
           <RealTimeStatus 
              snapshot={currentSnapshot}
              currentTime={currentTime}
              maxTime={maxTime}
           />
        )}

        {/* Gantt Chart */}
        {simulationResult ? (
          <Gantt events={simulationResult.events} currentTime={currentTime} />
        ) : (
          <div className="h-40 bg-white dark:bg-gray-800 rounded-lg shadow flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors duration-200">
            Run simulation to see Gantt Chart
          </div>
        )}

        {/* Metrics */}
        {metrics && (
          <SimulationMetrics metrics={metrics} isFinished={currentTime >= maxTime} />
        )}
      </div>
    </div>
  );
};