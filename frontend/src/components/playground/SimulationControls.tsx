import { EnergyConfig, Algorithm } from '@cpu-vis/shared';
import { useTranslation } from 'react-i18next';
import { InformationCircleIcon, ChevronRightIcon, PlayIcon } from '@heroicons/react/24/outline';

interface Props {
  selectedAlgorithm: Algorithm;
  setSelectedAlgorithm: (algo: Algorithm) => void;
  quantum: number;
  setQuantum: (q: number) => void;
  contextSwitch: number;
  setContextSwitch: (cs: number) => void;
  coreCount: number;
  setCoreCount: (count: number) => void;
  zoomLevel: number;
  setZoomLevel: (zoom: number) => void;
  energyConfig: EnergyConfig;
  setEnergyConfig: (config: EnergyConfig) => void;
  onRun: () => void;
  onOptimizeQuantum?: () => void;
  onShowTutorial?: () => void;
}

export const SimulationControls: React.FC<Props> = ({
  selectedAlgorithm,
  setSelectedAlgorithm,
  quantum,
  setQuantum,
  contextSwitch,
  setContextSwitch,
  coreCount,
  setCoreCount,
  energyConfig,
  setEnergyConfig,
  onRun,
  onOptimizeQuantum,
  onShowTutorial,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4 transition-colors duration-200"
      role="region"
      aria-label={t('controls.title')}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="sr-only">Controls</span>
        {onShowTutorial && (
          <button
            onClick={onShowTutorial}
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 group"
          >
            <InformationCircleIcon className="w-4 h-4" /> {t('controls.guide')}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-1 md:col-span-2">
          <label
            htmlFor="algorithm-select"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {t('controls.algorithm')}
          </label>
          <select
            id="algorithm-select"
            value={selectedAlgorithm}
            onChange={(e) => setSelectedAlgorithm(e.target.value as Algorithm)}
            className="w-full bg-white text-gray-900 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border transition-colors"
          >
            <option value="FCFS">{t('controls.algorithms.FCFS')}</option>
            <option value="SJF">{t('controls.algorithms.SJF')}</option>
            <option value="LJF">LJF (Longest Job First)</option>
            <option value="SRTF">{t('controls.algorithms.SRTF')}</option>
            <option value="RR">{t('controls.algorithms.RR')}</option>
            <option value="PRIORITY">{t('controls.algorithms.PRIORITY')}</option>
            <option value="PRIORITY_PE">Priority (Preemptive)</option>
            <option value="HRRN">HRRN (Highest Response Ratio Next)</option>
            <option value="LRTF">LRTF (Longest Remaining Time First)</option>
            <option value="MQ">MQ (Multilevel Queue - Q1:RR, Q2:FCFS)</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="core-count-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {t('controls.cores')}
          </label>
          <input
            id="core-count-input"
            type="number"
            min="1"
            max="8"
            value={coreCount}
            onChange={(e) => setCoreCount(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-white text-gray-900 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="context-switch-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {t('controls.contextSwitch')} ({t('common.ms')})
          </label>
          <input
            id="context-switch-input"
            type="number"
            min="0"
            value={contextSwitch}
            onChange={(e) => setContextSwitch(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full bg-white text-gray-900 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border transition-colors"
          />
        </div>

        {selectedAlgorithm === 'RR' && (
          <div className="col-span-1 md:col-span-2">
            <label
              htmlFor="quantum-input"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              {t('controls.quantum')}
            </label>
            <div className="flex gap-2">
              <input
                id="quantum-input"
                type="number"
                min="1"
                value={quantum}
                onChange={(e) => setQuantum(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-white text-gray-900 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2 border transition-colors"
              />
              {onOptimizeQuantum && (
                <button
                  onClick={onOptimizeQuantum}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 rounded whitespace-nowrap"
                  title={t('controls.optimizeHint')}
                >
                  {t('controls.optimize')}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <details className="mt-4 group">
        <summary className="text-sm font-medium text-blue-600 dark:text-blue-400 cursor-pointer list-none flex items-center gap-1">
          <ChevronRightIcon className="w-4 h-4 group-open:rotate-90 transition-transform" />
          {t('controls.energyTitle')}
        </summary>
        <div className="grid grid-cols-2 gap-4 mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-100 dark:border-gray-700">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">
              {t('controls.activePower')} ({t('common.watts')})
            </label>
            <input
              type="number"
              value={energyConfig.activeWatts}
              onChange={(e) =>
                setEnergyConfig({ ...energyConfig, activeWatts: parseFloat(e.target.value) || 0 })
              }
              className="w-full text-sm bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none py-1 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">
              {t('controls.idlePower')} ({t('common.watts')})
            </label>
            <input
              type="number"
              value={energyConfig.idleWatts}
              onChange={(e) =>
                setEnergyConfig({ ...energyConfig, idleWatts: parseFloat(e.target.value) || 0 })
              }
              className="w-full text-sm bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none py-1 dark:text-white"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase">
              {t('controls.switchCost')} ({t('common.joules')})
            </label>
            <input
              type="number"
              step="0.01"
              value={energyConfig.switchJoules}
              onChange={(e) =>
                setEnergyConfig({ ...energyConfig, switchJoules: parseFloat(e.target.value) || 0 })
              }
              className="w-full text-sm bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none py-1 dark:text-white"
            />
          </div>
        </div>
      </details>

      <button
        onClick={onRun}
        className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center gap-2"
      >
        <PlayIcon className="w-5 h-5" />
        {t('common.run')}
      </button>
    </div>
  );
};
