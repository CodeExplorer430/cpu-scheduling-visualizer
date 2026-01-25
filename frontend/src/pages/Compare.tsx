import React, { useState } from 'react';
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

  const handleRunComparison = () => {
    setResults({
      FCFS: runFCFS(processes),
      SJF: runSJF(processes),
      SRTF: runSRTF(processes),
      RR: runRR(processes, quantum),
      PRIORITY: runPriority(processes),
    });
    toast.success('Comparison updated');
  };

  const algorithms: Algorithm[] = ['FCFS', 'SJF', 'SRTF', 'RR', 'PRIORITY'];

  return (
    <div className="space-y-8">
      {/* Top: Controls & Input */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4">
          <ComparisonSettings quantum={quantum} setQuantum={setQuantum} onRun={handleRunComparison} />
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
