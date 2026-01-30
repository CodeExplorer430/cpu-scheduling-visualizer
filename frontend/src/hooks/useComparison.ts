import { useState, useCallback } from 'react';
import {
  Process,
  SimulationResult,
  Algorithm,
  runFCFS,
  runSJF,
  runLJF,
  runSRTF,
  runLRTF,
  runRR,
  runPriority,
  runPriorityPreemptive,
  runMQ,
  runMLFQ,
  runHRRN,
} from '@cpu-vis/shared';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export const useComparison = (processes: Process[]) => {
  const [quantum, setQuantum] = useState<number>(2);
  const [results, setResults] = useState<Record<Algorithm, SimulationResult> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const runComparison = useCallback(() => {
    setIsLoading(true);
    // Add a small delay to allow UI to update (show loading state) before heavy sync computation
    setTimeout(() => {
      try {
        const options = { quantum };
        const newResults: Record<string, SimulationResult> = {};

        newResults['FCFS'] = runFCFS(processes, options);
        newResults['SJF'] = runSJF(processes, options);
        newResults['LJF'] = runLJF(processes, options);
        newResults['SRTF'] = runSRTF(processes, options);
        newResults['LRTF'] = runLRTF(processes, options);
        newResults['RR'] = runRR(processes, options);
        newResults['PRIORITY'] = runPriority(processes, options);
        newResults['PRIORITY_PE'] = runPriorityPreemptive(processes, options);
        newResults['MQ'] = runMQ(processes, options);
        newResults['MLFQ'] = runMLFQ(processes, options);
        newResults['HRRN'] = runHRRN(processes, options);

        setResults(newResults as Record<Algorithm, SimulationResult>);
        toast.success(t('common.run') + ' ' + t('common.play'));
      } catch (error) {
        console.error('Simulation error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  }, [processes, quantum, t]);

  return {
    quantum,
    setQuantum,
    results,
    isLoading,
    runComparison,
  };
};
