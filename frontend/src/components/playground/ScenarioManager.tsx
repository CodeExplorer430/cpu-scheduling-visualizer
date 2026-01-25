import React, { useState } from 'react';
import { Process } from '@cpu-vis/shared';
import toast from 'react-hot-toast';

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

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required');
    try {
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, processes }),
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Scenario saved');
      setShowSaveModal(false);
      setName('');
    } catch (error) {
      toast.error('Error saving scenario');
      console.error(error);
    }
  };

  const fetchScenarios = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/scenarios');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setScenarios(data);
    } catch (error) {
      toast.error('Error loading scenarios');
    } finally {
      setLoading(false);
    }
  };

  const handleLoad = async (id: string) => {
    try {
      const res = await fetch(`/api/scenarios/${id}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      onLoad(data.processes);
      toast.success(`Loaded "${data.name}"`);
      setShowLoadModal(false);
    } catch (error) {
      toast.error('Error loading scenario details');
    }
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => setShowSaveModal(true)}
        className="bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-200 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap"
      >
        Save
      </button>
      <button
        onClick={() => {
          setShowLoadModal(true);
          fetchScenarios();
        }}
        className="bg-indigo-100 hover:bg-indigo-200 dark:bg-indigo-900 dark:hover:bg-indigo-800 text-indigo-700 dark:text-indigo-200 px-3 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap"
      >
        Load
      </button>

      {/* Save Modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-96">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Save Scenario</h3>
            <input
              type="text"
              placeholder="Scenario Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border p-2 rounded mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSaveModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Load Modal */}
      {showLoadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-lg max-h-[80vh] flex flex-col">
            <h3 className="text-lg font-bold mb-4 dark:text-white">Load Scenario</h3>
            <div className="flex-1 overflow-y-auto min-h-[200px]">
              {loading ? (
                <p className="text-center py-4 dark:text-gray-400">Loading...</p>
              ) : scenarios.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No saved scenarios found.</p>
              ) : (
                <ul className="space-y-2">
                  {scenarios.map((s) => (
                    <li
                      key={s._id}
                      className="border p-3 rounded hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700 cursor-pointer flex justify-between items-center"
                      onClick={() => handleLoad(s._id)}
                    >
                      <div>
                        <p className="font-medium dark:text-white">{s.name}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(s.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="text-indigo-600 dark:text-indigo-400 text-sm">Load</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowLoadModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
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
