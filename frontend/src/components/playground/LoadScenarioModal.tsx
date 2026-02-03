import React from 'react';
import {
  FolderOpenIcon,
  XMarkIcon,
  TrashIcon,
  CloudIcon,
  ComputerDesktopIcon,
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';

interface ScenarioSummary {
  _id: string;
  name: string;
  createdAt: string;
  source?: 'cloud' | 'local';
}

interface LoadScenarioModalProps {
  isOpen: boolean;
  onClose: () => void;
  scenarios: ScenarioSummary[];
  loading: boolean;
  onLoad: (id: string) => void;
  onDelete?: (id: string) => void;
}

export const LoadScenarioModal: React.FC<LoadScenarioModalProps> = ({
  isOpen,
  onClose,
  scenarios,
  loading,
  onLoad,
  onDelete,
}) => {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col transform transition-all">
        <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-3">
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
            <FolderOpenIcon className="w-6 h-6 text-indigo-600" />
            {t('modals.load.title')}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-[200px] py-2">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('modals.load.fetching')}
              </p>
            </div>
          ) : scenarios.length === 0 ? (
            <div className="text-center py-12">
              <FolderOpenIcon className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">{t('modals.load.empty')}</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {scenarios.map((s) => (
                <div
                  key={s._id}
                  className="group border border-gray-200 dark:border-gray-700 p-4 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-all flex justify-between items-center"
                  onClick={() => onLoad(s._id)}
                >
                  <div className="flex-1 min-w-0 pr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-300 transition-colors truncate">
                        {s.name}
                      </p>
                      {s.source === 'local' ? (
                        <span className="inline-flex items-center gap-0.5 rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-300">
                          <ComputerDesktopIcon className="w-3 h-3" /> {t('modals.load.local')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 rounded bg-blue-100 dark:bg-blue-900/40 px-1.5 py-0.5 text-[10px] font-medium text-blue-600 dark:text-blue-300">
                          <CloudIcon className="w-3 h-3" /> {t('modals.load.cloud')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <span className="opacity-60">{t('modals.load.created')}</span>{' '}
                      {new Date(s.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                      {t('common.load')}
                    </button>
                    {onDelete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(t('modals.load.confirmDelete', { name: s.name }))) {
                            onDelete(s._id);
                          }
                        }}
                        className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={t('common.delete')}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
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
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
