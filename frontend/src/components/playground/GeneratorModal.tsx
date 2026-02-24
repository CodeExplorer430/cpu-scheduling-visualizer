import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { XMarkIcon, BoltIcon } from '@heroicons/react/24/outline';
import { Process, generateRandomProcesses } from '@cpu-vis/shared';
import { NumberInput } from '../common/NumberInput';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (processes: Process[]) => void;
}

type ScenarioType =
  | 'random'
  | 'burst_heavy'
  | 'io_heavy'
  | 'many_short'
  | 'long_running'
  | 'starvation'
  | 'fair_share_groups'
  | 'lottery_weighted'
  | 'edf_deadline_driven'
  | 'rms_periodic';

export const GeneratorModal: React.FC<Props> = ({ isOpen, onClose, onGenerate }) => {
  const { t } = useTranslation();
  const [type, setType] = useState<ScenarioType>('random');
  const [count, setCount] = useState(10);

  const handleGenerate = () => {
    let processes: Process[] = [];

    switch (type) {
      case 'burst_heavy':
        processes = generateRandomProcesses({
          count,
          arrivalRange: [0, 20],
          burstRange: [15, 50], // Long bursts
        });
        break;
      case 'io_heavy':
        // Short bursts but frequent? Simulation treats burst as CPU time.
        // IO heavy usually means many short CPU bursts.
        processes = generateRandomProcesses({
          count,
          arrivalRange: [0, 50],
          burstRange: [1, 5],
        });
        break;
      case 'many_short':
        processes = generateRandomProcesses({
          count: count * 2, // More processes
          arrivalRange: [0, 10],
          burstRange: [1, 3],
        });
        break;
      case 'long_running':
        processes = generateRandomProcesses({
          count: Math.max(2, Math.floor(count / 2)),
          arrivalRange: [0, 5],
          burstRange: [50, 200],
        });
        break;
      case 'starvation': {
        // One long process, many short ones arriving continuously
        const longP: Process = {
          pid: 'P_LONG',
          arrival: 0,
          burst: 100,
          priority: 5,
          color: '#ef4444',
        };
        const shorts = generateRandomProcesses({
          count: count - 1,
          arrivalRange: [2, 50],
          burstRange: [1, 5],
        });
        // Set higher priority for shorts (lower number)
        shorts.forEach((p) => (p.priority = 1));
        processes = [longP, ...shorts];
        break;
      }
      case 'fair_share_groups': {
        processes = generateRandomProcesses({
          count,
          arrivalRange: [0, 20],
          burstRange: [2, 12],
        }).map((p, idx) => {
          const groupIdx = idx % 3;
          const group = ['system', 'interactive', 'batch'][groupIdx];
          const weight = [3, 2, 1][groupIdx];
          return {
            ...p,
            shareGroup: group,
            shareWeight: weight,
          };
        });
        break;
      }
      case 'lottery_weighted': {
        processes = generateRandomProcesses({
          count,
          arrivalRange: [0, 15],
          burstRange: [2, 10],
        }).map((p, idx) => {
          const highWeight = idx % 3 === 0;
          return {
            ...p,
            tickets: highWeight ? 10 : 1,
          };
        });
        break;
      }
      case 'edf_deadline_driven': {
        processes = generateRandomProcesses({
          count,
          arrivalRange: [0, 20],
          burstRange: [1, 8],
        }).map((p) => ({
          ...p,
          deadline: p.arrival + p.burst + Math.floor(Math.random() * 6) + 1,
        }));
        break;
      }
      case 'rms_periodic': {
        processes = generateRandomProcesses({
          count,
          arrivalRange: [0, 10],
          burstRange: [1, 6],
        }).map((p, idx) => ({
          ...p,
          period: (idx % 5) + 2,
        }));
        break;
      }
      case 'random':
      default:
        processes = generateRandomProcesses({
          count,
          arrivalRange: [0, 10],
          burstRange: [1, 10],
        });
    }

    onGenerate(processes);
    onClose();
  };

  const scenarioTypes: ScenarioType[] = [
    'random',
    'burst_heavy',
    'io_heavy',
    'many_short',
    'long_running',
    'starvation',
    'fair_share_groups',
    'lottery_weighted',
    'edf_deadline_driven',
    'rms_periodic',
  ];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <Dialog.Title className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <BoltIcon className="w-5 h-5 text-yellow-500" />
              {t('generator.title')}
            </Dialog.Title>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('generator.type')}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ScenarioType)}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white py-2 px-3 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              >
                {scenarioTypes.map((st) => (
                  <option key={st} value={st}>
                    {t(`generator.types.${st}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('generator.count')}
              </label>
              <NumberInput value={count} onChange={setCount} min={1} max={500} />
            </div>

            <div className="pt-4 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleGenerate}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {t('generator.generate')}
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
