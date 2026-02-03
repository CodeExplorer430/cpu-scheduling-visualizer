import React, { useState } from 'react';
import { Process } from '@cpu-vis/shared';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { handleApiResponse } from '../../lib/api';
import { SaveScenarioModal } from './SaveScenarioModal';
import { LoadScenarioModal } from './LoadScenarioModal';

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

      <SaveScenarioModal
        isOpen={showSaveModal}
        onClose={() => setShowSaveModal(false)}
        onSave={handleSave}
        name={name}
        setName={setName}
      />

      <LoadScenarioModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        scenarios={scenarios}
        loading={loading}
        onLoad={handleLoad}
      />
    </div>
  );
};
