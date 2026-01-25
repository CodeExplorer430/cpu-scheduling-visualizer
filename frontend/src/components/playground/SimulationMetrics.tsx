import React from 'react';
import { Metrics } from '@cpu-vis/shared';
import { useTranslation } from 'react-i18next';

interface Props {
  metrics: Metrics;
  isFinished: boolean;
}

export const SimulationMetrics: React.FC<Props> = ({ metrics, isFinished }) => {
  const { t } = useTranslation();
  const energy = metrics.energy;

  // Simple Performance Score (0-100) based on Average Waiting time relative to total burst
  // Lower waiting = higher score. This is a basic auto-grading heuristic.
  const performanceScore = Math.max(0, 100 - metrics.avgWaiting * 2).toFixed(1);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">{t('metrics.title')}</h3>
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
            {t('metrics.energy')} ({t('common.joules')})
          </p>
          <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">
            {energy ? energy.totalEnergy.toFixed(1) : 'N/A'}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider">
            Perf. Score
          </p>
          <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
            {performanceScore}%
          </p>
        </div>
      </div>

      {energy && (
        <div className="px-4 pb-4 bg-gray-50 dark:bg-gray-900">
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-100 dark:border-gray-700">
            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Energy Breakdown</p>
            <div className="flex gap-4 text-[10px] sm:text-xs">
              <span className="text-gray-600 dark:text-gray-400">
                {t('metrics.active')}:{' '}
                <b className="text-gray-900 dark:text-white">{energy.activeEnergy.toFixed(1)}{t('common.joules')}</b>
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {t('metrics.idle')}:{' '}
                <b className="text-gray-900 dark:text-white">{energy.idleEnergy.toFixed(1)}{t('common.joules')}</b>
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                {t('metrics.switches')}:{' '}
                <b className="text-gray-900 dark:text-white">{energy.switchEnergy.toFixed(1)}{t('common.joules')}</b>
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
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
