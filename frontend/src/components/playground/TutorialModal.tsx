import React, { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  XMarkIcon, 
  LightBulbIcon, 
  ChevronRightIcon,
  ChevronLeftIcon,
  PlayCircleIcon,
  PauseCircleIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface TutorialStep {
  title: string;
  description: string;
  image?: string; // Placeholder for future diagram support
}

const STEPS: TutorialStep[] = [
  {
    title: 'Welcome to Quantix',
    description: 'This interactive tutorial will guide you through the core concepts of CPU scheduling algorithms. Learn how processes are managed, executed, and prioritized by the operating system.'
  },
  {
    title: 'Processes & The Ready Queue',
    description: 'A process is a program in execution. In our visualizer, processes waiting for CPU time are placed in the "Ready Queue". Algorithms decide WHICH process from this queue runs next.'
  },
  {
    title: 'The Gantt Chart',
    description: 'The timeline below is a Gantt Chart. It visualizes the execution order. Blocks represent time slices given to processes. "CS" blocks represent Context Switching overhead.'
  },
  {
    title: 'First-Come, First-Served (FCFS)',
    description: 'The simplest algorithm. Processes are executed in the exact order they arrive. Great for simplicity, but can lead to the "Convoy Effect" where short processes wait behind long ones.'
  },
  {
    title: 'Round Robin (RR)',
    description: 'Designed for fair sharing. Each process gets a fixed "Time Quantum" (e.g., 2ms). If it doesn\'t finish, it moves to the back of the queue. Try adjusting the Quantum slider!'
  },
  {
    title: 'Shortest Job First (SJF)',
    description: 'Optimizes for minimum waiting time. The process with the shortest burst time runs first. However, long processes may starve if short ones keep arriving.'
  },
  {
    title: 'Step-by-Step Execution',
    description: 'Use the "Step Forward" button to see exactly why an algorithm made a decision. The "Decision Log" panel will explain the logic (e.g., "Selected P1 because priority is highest").'
  }
];

export const TutorialModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
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

  const step = STEPS[currentStep];

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
                <span className="text-xs font-bold uppercase tracking-wider opacity-80">Interactive Guide</span>
              </div>
              <Dialog.Title className="text-2xl font-bold">
                {step.title}
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
              {step.description}
            </p>
            
            {/* Visual indicator of progress */}
            <div className="flex gap-1 mt-8 mb-2">
              {STEPS.map((_, idx) => (
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
              Step {currentStep + 1} of {STEPS.length}
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
              <ChevronLeftIcon className="w-4 h-4" /> Back
            </button>

            <button
              onClick={handleNext}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 transition-all transform hover:scale-105"
            >
              {currentStep === STEPS.length - 1 ? (
                <>Finish Tutorial <PlayCircleIcon className="w-5 h-5" /></>
              ) : (
                <>Next <ChevronRightIcon className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};