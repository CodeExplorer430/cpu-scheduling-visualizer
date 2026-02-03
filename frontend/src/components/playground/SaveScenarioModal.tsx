import React from 'react';
import { CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SaveScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  name: string;
  setName: (name: string) => void;
}

export const SaveScenarioModal: React.FC<SaveScenarioModalProps> = ({
  isOpen,
  onClose,
  onSave,
  name,
  setName,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md transform transition-all">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
            <CloudArrowUpIcon className="w-6 h-6 text-indigo-600" />
            Save Scenario
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <input
          type="text"
          placeholder="Scenario Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border border-gray-300 dark:border-gray-600 p-2.5 rounded-md mb-4 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
          autoFocus
        />
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-md hover:bg-indigo-700 transition-colors shadow-md"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
