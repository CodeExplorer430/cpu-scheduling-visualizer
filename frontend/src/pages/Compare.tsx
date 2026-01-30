import React from 'react';
import {
  Process,
  Algorithm,
} from '@cpu-vis/shared';
import { ProcessTable } from '../components/ProcessTable';
import { ComparisonSettings } from '../components/compare/ComparisonSettings';
import { ComparisonResults } from '../components/compare/ComparisonResults';
import { useComparison } from '../hooks/useComparison';

interface Props {
  processes: Process[];
  onProcessesChange: (p: Process[]) => void;
}

export const Compare: React.FC<Props> = ({ processes, onProcessesChange }) => {
  const {
    quantum,
    setQuantum,
    results,
    isLoading,
    runComparison,
  } = useComparison(processes);

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
            onRun={runComparison}
          />
          {isLoading && (
            <div className="mt-2 text-center text-sm text-blue-600 animate-pulse">
              Computing batch results...
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