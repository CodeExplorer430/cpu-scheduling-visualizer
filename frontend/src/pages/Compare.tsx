import React, { useState } from 'react';
import { Process, SimulationResult, Algorithm } from '@cpu-vis/shared';
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
    const algorithms: Algorithm[] = ['FCFS', 'SJF', 'SRTF', 'RR', 'PRIORITY'];

    try {
      const response = await fetch('http://localhost:3000/api/simulate/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          algorithms,
          processes,
          timeQuantum: quantum,
        }),
      });

      if (!response.ok) throw new Error('Failed to run batch simulation');

      const data = await response.json();
      setResults(data);
      toast.success(t('common.run') + ' ' + t('common.play'));
    } catch (error) {
      console.error('Batch simulation error:', error);
      const message = error instanceof Error ? error.message : 'Error communicating with backend';
      toast.error(message);

      // Fallback to client-side if backend fails
      // setResults({ ... });
    } finally {
      setIsLoading(false);
    }
  };

  const algorithms: Algorithm[] = ['FCFS', 'SJF', 'SRTF', 'RR', 'PRIORITY'];

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
