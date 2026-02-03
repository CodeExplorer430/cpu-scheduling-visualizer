import React from 'react';
import { FolderOpenIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface ScenarioSummary {
  _id: string;
  name: string;
  createdAt: string;
}

interface LoadScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: ScenarioSummary[];
  loading: boolean;
  onLoad: (id: string) => void;
}

export const LoadScenarioModal: React.FC<LoadScenarioModalProps> = ({
  isOpen,
  onClose,
  scenarios,
  loading,
  onLoad,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col transform transition-all">
        <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-3">
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <FolderOpenIcon className="w-6 h-6 text-indigo-600" />
            Load Scenario
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[200px] py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Fetching scenarios...</p>
            </div>
          ) : scenarios.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpenIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No saved scenarios found.</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {scenarios.map((s) => (
                <div
                  key={s._id}
                  className="group border border-gray-200 dark:border-gray-700 p-4 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-all flex justify-between items-center"
                  onClick={() => onLoad(s._id)}
                >
                  <div>
                    <p className="font-bold dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors">
                      {s.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                      <span className="opacity-60">Created:</span>{' '}
                      {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    Load
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end border-t dark:border-gray-700 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
