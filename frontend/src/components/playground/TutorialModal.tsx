import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import {
  XMarkIcon,
  LightBulbIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
  PlayCircleIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STEP_KEYS = [
  'welcome',
  'processes',
  'gantt',
  'fcfs',
  'rr',
  'sjf',
  'step',
];

export const TutorialModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEP_KEYS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
      setCurrentStep(0);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const stepKey = STEP_KEYS[currentStep];

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-0 shadow-2xl overflow-hidden transition-all transform">
          {/* Header */}
          <div className="bg-indigo-600 p-6 text-white flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <LightBulbIcon className="w-6 h-6 text-yellow-300" />
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                  {t('tutorial.title')}
                </span>
              </div>
              <Dialog.Title className="text-2xl font-bold">
                {t(`tutorial.steps.${stepKey}.title`)}
              </Dialog.Title>
            </div>
            <button
              onClick={onClose}
              className="text-white/70 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-8">
            <p className="text-gray-600 dark:text-gray-300 text-lg leading-relaxed">
              {t(`tutorial.steps.${stepKey}.desc`)}
            </p>

            {/* Visual indicator of progress */}
            <div className="flex gap-1 mt-8 mb-2">
              {STEP_KEYS.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 flex-1 rounded-full transition-colors ${
                    idx <= currentStep
                      ? 'bg-indigo-600 dark:bg-indigo-400'
                      : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              ))}
            </div>
            <div className="text-right text-xs text-gray-400 font-medium">
              Step {currentStep + 1} of {STEP_KEYS.length}
            </div>
          </div>

          {/* Footer / Controls */}
          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 flex justify-between items-center border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`flex items-center gap-1 text-sm font-medium transition-colors ${
                currentStep === 0
                  ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                  : 'text-gray-600 dark:text-gray-400 hover:text-indigo-600'
              }`}
            >
              <ChevronLeftIcon className="w-4 h-4" /> {t('tutorial.back')}
            </button>

            <button
              onClick={handleNext}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition-all transform hover:scale-105"
            >
              {currentStep === STEP_KEYS.length - 1 ? (
                <>
                  {t('tutorial.finish')} <PlayCircleIcon className="w-5 h-5" />
                </>
              ) : (
                <>
                  {t('tutorial.next')} <ChevronRightIcon className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};