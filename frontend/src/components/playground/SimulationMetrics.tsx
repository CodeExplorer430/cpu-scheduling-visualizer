import React, { useState } from 'react';
import { Metrics } from '@cpu-vis/shared';
import { useTranslation } from 'react-i18next';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface Props {
  metrics: Metrics;
  isFinished: boolean;
}

export const SimulationMetrics: React.FC<Props> = ({ metrics, isFinished }) => {
  const { t } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const energy = metrics.energy;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
          {t('metrics.title')}
        </h3>
        {!isFinished && (
          <span className="text-xs bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">
            Simulation in progress...
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900">
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
            {t('metrics.avgTurnaround')}
          </p>
          <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
            {metrics.avgTurnaround.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
            {t('metrics.avgWait')}
          </p>
          <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
            {metrics.avgWaiting.toFixed(2)}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
            Avg. Response
          </p>
          <p className="text-xl font-bold text-teal-600 dark:text-teal-400 mt-1">
            {metrics.avgResponse?.toFixed(2) ?? '-'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
            {t('metrics.energy')} ({t('common.joules')})
          </p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">
            {energy ? energy.totalEnergy.toFixed(1) : 'N/A'}
          </p>
        </div>
      </div>

      {/* Advanced Stats Toggle */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors"
        >
          {showAdvanced ? (
            <>
              Hide Detailed Statistics <ChevronUpIcon className="w-3 h-3" />
            </>
          ) : (
            <>
              Show Detailed Statistics <ChevronDownIcon className="w-3 h-3" />
            </>
          )}
        </button>
      </div>

      {/* Advanced Stats Section */}
      {showAdvanced && (
        <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-900 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 text-xs">
            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
              Turnaround Distribution
            </h4>
            <div className="flex justify-between mb-1">
              <span className="text-gray-500 dark:text-gray-400">Std Dev:</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {metrics.stdDevTurnaround?.toFixed(2) ?? '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">95th Percentile:</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {metrics.p95Turnaround?.toFixed(2) ?? '-'}
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 text-xs">
            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
              Waiting Distribution
            </h4>
            <div className="flex justify-between mb-1">
              <span className="text-gray-500 dark:text-gray-400">Std Dev:</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {metrics.stdDevWaiting?.toFixed(2) ?? '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">95th Percentile:</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {metrics.p95Waiting?.toFixed(2) ?? '-'}
              </span>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700 text-xs">
            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-2 border-b border-gray-100 dark:border-gray-700 pb-1">
              Response Distribution
            </h4>
            <div className="flex justify-between mb-1">
              <span className="text-gray-500 dark:text-gray-400">Std Dev:</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {metrics.stdDevResponse?.toFixed(2) ?? '-'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">95th Percentile:</span>
              <span className="font-mono text-gray-900 dark:text-white">
                {metrics.p95Response?.toFixed(2) ?? '-'}
              </span>
            </div>
          </div>
        </div>
      )}

      {energy && (
        <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Energy Breakdown</p>
            <div className="flex gap-4 text-[10px] sm:text-xs">
              <span className="text-gray-600 dark:text-gray-400">
                {t('metrics.active')}:{' '}
                <b className="text-gray-900 dark:text-white">
                  {energy.activeEnergy.toFixed(1)}
                  {t('common.joules')}
                </b>
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {t('metrics.idle')}:{' '}
                <b className="text-gray-900 dark:text-white">
                  {energy.idleEnergy.toFixed(1)}
                  {t('common.joules')}
                </b>
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {t('metrics.switches')}:{' '}
                <b className="text-gray-900 dark:text-white">
                  {energy.switchEnergy.toFixed(1)}
                  {t('common.joules')}
                </b>
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
          <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
            <tr>
              <th className="px-6 py-3">{t('processTable.pid')}</th>
              <th className="px-6 py-3">Completion</th>
              <th className="px-6 py-3">Turnaround</th>
              <th className="px-6 py-3">Waiting</th>
              <th className="px-6 py-3">Response</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {Object.keys(metrics.completion)
              .sort()
              .map((pid) => (
                <tr
                  key={pid}
                  className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">{pid}</td>
                  <td className="px-6 py-3">{metrics.completion[pid]}</td>
                  <td className="px-6 py-3">{metrics.turnaround[pid]}</td>
                  <td className="px-6 py-3">{metrics.waiting[pid]}</td>
                  <td className="px-6 py-3">{metrics.response ? metrics.response[pid] : '-'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
