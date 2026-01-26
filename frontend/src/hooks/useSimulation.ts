import { useState, useEffect, useCallback } from 'react';
import {
  runFCFS,
  runSJF,
  runLJF,
  runSRTF,
  runRR,
  runPriority,
  Process,
  SimulationResult,
  Algorithm,
  EnergyConfig,
} from '@cpu-vis/shared';
import toast from 'react-hot-toast';
import { findOptimalQuantum } from '../lib/optimizer';

export const useSimulation = (processes: Process[]) => {
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<Algorithm>('FCFS');
  const [quantum, setQuantum] = useState<number>(2);
  const [contextSwitch, setContextSwitch] = useState<number>(0);
  const [coreCount, setCoreCount] = useState<number>(1);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [energyConfig, setEnergyConfig] = useState<EnergyConfig>({
    activeWatts: 20,
    idleWatts: 5,
    switchJoules: 0.1,
  });
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const runSimulation = useCallback(() => {
    let result: SimulationResult;
    const options = {
      quantum,
      contextSwitchOverhead: contextSwitch,
      enableLogging: true,
      coreCount,
      energyConfig,
    };

    switch (selectedAlgorithm) {
      case 'FCFS':
        result = runFCFS(processes, options);
        break;
      case 'SJF':
        result = runSJF(processes, options);
        break;
      case 'LJF':
        result = runLJF(processes, options);
        break;
      case 'SRTF':
        result = runSRTF(processes, options);
        break;
      case 'RR':
        result = runRR(processes, options);
        break;
      case 'PRIORITY':
        result = runPriority(processes, options);
        break;
      default:
        result = runFCFS(processes, options);
    }

    setSimulationResult(result);
    setCurrentTime(0);
    setIsPlaying(false);
    toast.success('Simulation started');
  }, [processes, selectedAlgorithm, quantum, contextSwitch, coreCount, energyConfig]);

  const optimizeQuantum = useCallback(() => {
    const { optimalQuantum, minAvgWaiting } = findOptimalQuantum(processes);
    setQuantum(optimalQuantum);
    toast.success(
      `Optimal Quantum found: ${optimalQuantum} (Avg Wait: ${minAvgWaiting.toFixed(2)})`
    );
  }, [processes]);

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
    contextSwitch,
    setContextSwitch,
    coreCount,
    setCoreCount,
    zoomLevel,
    setZoomLevel,
    energyConfig,
    setEnergyConfig,
    simulationResult,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    runSimulation,
    optimizeQuantum,
  };
};
