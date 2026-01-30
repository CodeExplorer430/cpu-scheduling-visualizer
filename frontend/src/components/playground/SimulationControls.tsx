import { EnergyConfig, Algorithm, SimulationResult, parseTrace } from '@cpu-vis/shared';
import { useTranslation } from 'react-i18next';
import {
  InformationCircleIcon,
  ChevronRightIcon,
  PlayIcon,
  DocumentArrowUpIcon,
} from '@heroicons/react/24/outline';
import { NumberInput } from '../common/NumberInput';
import toast from 'react-hot-toast';

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
  onImportTrace?: (result: SimulationResult) => void;
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
  onImportTrace,
}) => {
  const { t } = useTranslation();

  const handleTraceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = parseTrace(content); // Use the smart parser

        if (onImportTrace) {
          onImportTrace(result);
          toast.success('Trace loaded successfully');
        }
      } catch (error) {
        console.error('Trace load error:', error);
        const msg = error instanceof Error ? error.message : 'Invalid trace format';
        toast.error(`Failed to load trace: ${msg}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div
      className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow space-y-4 transition-colors duration-200"
      role="region"
      aria-label={t('controls.title')}
    >
      <div className="flex justify-between items-center mb-2">
        <span className="sr-only">Controls</span>
        <div className="flex gap-3">
          {onShowTutorial && (
            <button
              onClick={onShowTutorial}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 group"
            >
              <InformationCircleIcon className="w-4 h-4" /> {t('controls.guide')}
            </button>
          )}
          {onImportTrace && (
            <label className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer group">
              <DocumentArrowUpIcon className="w-4 h-4" /> Import Trace
              <input
                type="file"
                accept=".json"
                onChange={handleTraceUpload}
                className="hidden"
              />
            </label>
          )}
        </div>
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
            <option value="LJF">{t('controls.algorithms.LJF')}</option>
            <option value="SRTF">{t('controls.algorithms.SRTF')}</option>
            <option value="RR">{t('controls.algorithms.RR')}</option>
            <option value="PRIORITY">{t('controls.algorithms.PRIORITY')}</option>
            <option value="PRIORITY_PE">{t('controls.algorithms.PRIORITY_PE')}</option>
            <option value="HRRN">{t('controls.algorithms.HRRN')}</option>
            <option value="LRTF">{t('controls.algorithms.LRTF')}</option>
            <option value="MQ">{t('controls.algorithms.MQ')}</option>
            <option value="MLFQ">{t('controls.algorithms.MLFQ')}</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="core-count-input"
            className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
          >
            {t('controls.cores')}
          </label>
          <NumberInput
            id="core-count-input"
            min={1}
            max={8}
            value={coreCount}
            onChange={setCoreCount}
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
          <NumberInput
            id="context-switch-input"
            min={0}
            value={contextSwitch}
            onChange={setContextSwitch}
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
              <NumberInput
                id="quantum-input"
                min={1}
                value={quantum}
                onChange={setQuantum}
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
            <NumberInput
              value={energyConfig.activeWatts}
              onChange={(val) => setEnergyConfig({ ...energyConfig, activeWatts: val })}
              className="w-full text-sm bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none py-1 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase">
              {t('controls.idlePower')} ({t('common.watts')})
            </label>
            <NumberInput
              value={energyConfig.idleWatts}
              onChange={(val) => setEnergyConfig({ ...energyConfig, idleWatts: val })}
              className="w-full text-sm bg-transparent border-b border-gray-300 dark:border-gray-600 focus:border-blue-500 outline-none py-1 dark:text-white"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase">
              {t('controls.switchCost')} ({t('common.joules')})
            </label>
            <NumberInput
              step={0.01}
              value={energyConfig.switchJoules}
              onChange={(val) => setEnergyConfig({ ...energyConfig, switchJoules: val })}
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
