import { useState, useEffect, useCallback } from 'react';
import {
  runFCFS,
  runSJF,
  runSRTF,
  runRR,
  runPriority,
  Process,
  SimulationResult,
  Algorithm,
} from '@cpu-vis/shared';
import toast from 'react-hot-toast';

export const useSimulation = (processes: Process[]) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('FCFS');
  const [quantum, setQuantum] = useState<number>(2);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const runSimulation = useCallback(() => {
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
      case 'PRIORITY':
        result = runPriority(processes);
        break;
      default:
        result = runFCFS(processes);
    }

    setSimulationResult(result);
    setCurrentTime(0);
    setIsPlaying(false);
    toast.success('Simulation started');
  }, [processes, selectedAlgorithm, quantum]);

  // Auto-play logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && simulationResult) {
      const maxTime =
        simulationResult.events.length > 0
          ? simulationResult.events[simulationResult.events.length - 1].end
          : 0;

      if (currentTime < maxTime) {
        interval = setInterval(() => {
          setCurrentTime((prev) => prev + 1);
        }, 1000); // 1 second per time unit
      } else {
        setIsPlaying(false);
      }
    }
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, simulationResult]);

  return {
    selectedAlgorithm,
    setSelectedAlgorithm,
    quantum,
    setQuantum,
    simulationResult,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    runSimulation,
  };
};
