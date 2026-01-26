import React from 'react';
import { PlayIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

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
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t('controls.quantum')}
          </label>
          <input
            type="number"
            min="1"
            value={quantum}
            onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-white text-gray-900 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border transition-colors"
          />
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
