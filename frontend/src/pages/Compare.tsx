import React, { useState } from 'react';
import {
  runFCFS,
  runSJF,
  runSRTF,
  runRR,
  Process,
  SimulationResult,
  Algorithm,
} from '@cpu-vis/shared';
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
      PRIORITY: runFCFS(processes), // Placeholder
    });
  };

  const algorithms: Algorithm[] = ['FCFS', 'SJF', 'SRTF', 'RR'];

  return (
    <div className="space-y-8">
      {/* Top: Controls & Input */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ComparisonSettings quantum={quantum} setQuantum={setQuantum} onRun={handleRunComparison} />

        <div className="overflow-auto max-h-96">
          <ProcessTable processes={processes} onProcessChange={onProcessesChange} />
        </div>
      </div>

      {/* Results */}
      {results && <ComparisonResults results={results} algorithms={algorithms} />}
    </div>
  );
};
