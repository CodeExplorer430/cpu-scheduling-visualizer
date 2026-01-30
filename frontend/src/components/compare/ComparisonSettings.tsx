import React from 'react';
import { PlayIcon, Cog6ToothIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import { NumberInput } from '../common/NumberInput';

interface Props {
  quantum: number;
  setQuantum: (q: number) => void;
  onRun: () => void;
}

export const ComparisonSettings: React.FC<Props> = ({ quantum, setQuantum, onRun }) => {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
        <Cog6ToothIcon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        {t('compare.title')}
      </h2>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4 transition-colors duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <label
              htmlFor="quantum-input"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              {t('controls.quantum')}
            </label>
            <div className="group relative flex items-center">
              <InformationCircleIcon className="w-4 h-4 text-gray-400 hover:text-blue-500 cursor-help" />
              <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-48 p-2 bg-gray-800 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                The time slice assigned to each process in Round Robin scheduling. Smaller values
                mean more responsiveness but higher overhead.
              </span>
            </div>
          </div>
          <NumberInput id="quantum-input" value={quantum} onChange={setQuantum} min={1} />
        </div>
        <button
          onClick={onRun}
          className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm flex items-center justify-center gap-2"
        >
          <PlayIcon className="w-5 h-5" />
          {t('compare.runComparison')}
        </button>
      </div>
    </div>
  );
};
