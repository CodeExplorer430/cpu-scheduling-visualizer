import React, { useState } from 'react';
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
import { ProcessTable } from '../components/ProcessTable';
import { ComparisonSettings } from '../components/compare/ComparisonSettings';
import { ComparisonResults } from '../components/compare/ComparisonResults';

interface Props {
  processes: Process[];
  onProcessesChange: (p: Process[]) => void;
}

export const Compare: React.FC<Props> = ({ processes, onProcessesChange }) => {
  const [quantum, setQuantum] = useState<number>(2);
  const [results, setResults] = useState<Record<Algorithm, SimulationResult> | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { t } = useTranslation();

  const handleRunComparison = async () => {
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
  };

  const algorithms: Algorithm[] = [
    'FCFS',
    'SJF',
    'LJF',
    'SRTF',
    'LRTF',
    'RR',
    'PRIORITY',
    'PRIORITY_PE',
    'MQ',
    'MLFQ',
    'HRRN',
  ];

  return (
    <div className="space-y-8">
      {/* Top: Controls & Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4">
          <ComparisonSettings
            quantum={quantum}
            setQuantum={setQuantum}
            onRun={handleRunComparison}
          />
          {isLoading && (
            <div className="mt-2 text-center text-sm text-blue-600 animate-pulse">
              Computing batch results on server...
            </div>
          )}
        </div>

        <div className="lg:col-span-8">
          <ProcessTable processes={processes} onProcessChange={onProcessesChange} />
        </div>
      </div>

      {/* Results */}
      {results && <ComparisonResults results={results} algorithms={algorithms} />}
    </div>
  );
};
