import React from 'react';
import { PlayIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
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
        <NumberInput
          id="quantum-input"
          label={t('controls.quantum')}
          value={quantum}
          onChange={setQuantum}
          min={1}
        />
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
