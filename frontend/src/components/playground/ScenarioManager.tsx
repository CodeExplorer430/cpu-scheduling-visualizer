import React, { useState } from 'react';
import { Process } from '@cpu-vis/shared';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon, FolderOpenIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { handleApiResponse } from '../../lib/api';

interface Props {
  processes: Process[];
  onLoad: (processes: Process[]) => void;
}

interface Scenario {
  _id: string;
  name: string;
  description?: string;
  processes: Process[];
  createdAt: string;
}

export const ScenarioManager: React.FC<Props> = ({ processes, onLoad }) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [name, setName] = useState('');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();

  const handleSave = async () => {
    if (!isAuthenticated) return toast.error('Please login to save scenarios');
    if (!name.trim()) return toast.error('Name is required');

    try {
      const res = await fetch(`/api/scenarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, processes }),
      });

      await handleApiResponse(res);

      toast.success('Scenario saved');
      setShowSaveModal(false);
      setName('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error saving scenario');
      console.error(error);
    }
  };

  const fetchScenarios = async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/scenarios`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await handleApiResponse<Scenario[]>(res);
      setScenarios(data);
    } catch (error) {
      console.error('Fetch scenarios error:', error);
      toast.error(error instanceof Error ? error.message : 'Error loading scenarios');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (id: string) => {
    try {
      const res = await fetch(`/api/scenarios/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await handleApiResponse<Scenario>(res);
      onLoad(data.processes);
      toast.success(`Loaded "${data.name}"`);
      setShowLoadModal(false);
    } catch (error) {
      console.error('Load scenario error:', error);
      toast.error(error instanceof Error ? error.message : 'Error loading scenario details');
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setShowSaveModal(true)}
        className="bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-200 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1"
      >
        <CloudArrowUpIcon className="w-3.5 h-3.5" />
        Save
      </button>
      <button
        onClick={() => {
          setShowLoadModal(true);
          fetchScenarios();
        }}
        className="bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-200 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1"
      >
        <FolderOpenIcon className="w-3.5 h-3.5" />
        Load
      </button>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-w-md transform transition-all">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                <CloudArrowUpIcon className="w-6 h-6 text-indigo-600" />
                Save Scenario
              </h3>
              <button
                onClick={() => setShowSaveModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
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
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-indigo-600 text-white text-sm font-bold rounded-md hover:bg-indigo-700 transition-colors shadow-md"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full max-lg max-h-[80vh] flex flex-col transform transition-all">
            <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-3">
              <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">
                <FolderOpenIcon className="w-6 h-6 text-indigo-600" />
                Load Scenario
              </h3>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
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
                      onClick={() => handleLoad(s._id)}
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
                onClick={() => setShowLoadModal(false)}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm font-medium rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
