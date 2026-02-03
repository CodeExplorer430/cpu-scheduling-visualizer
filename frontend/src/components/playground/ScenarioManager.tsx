import React, { useState, useEffect } from 'react';
import { Process } from '@cpu-vis/shared';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon, FolderOpenIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { handleApiResponse } from '../../lib/api';
import { SaveScenarioModal } from './SaveScenarioModal';
import { LoadScenarioModal } from './LoadScenarioModal';
import { persistence } from '../../lib/persistence';

interface Props {
  processes: Process[];
  onLoad: (processes: Process[]) => void;
}

export interface Scenario {
  _id: string;
  name: string;
  description?: string;
  processes: Process[];
  createdAt: string;
  source?: 'cloud' | 'local';
}

export const ScenarioManager: React.FC<Props> = ({ processes, onLoad }) => {
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [name, setName] = useState('');
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const { token, isAuthenticated } = useAuth();
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return toast.error('Name is required');

    // If offline or not logged in, save locally
    if (!isAuthenticated || !isOnline) {
      try {
        await persistence.saveScenario(name, processes);
        toast.success('Scenario saved locally');
        setShowSaveModal(false);
        setName('');
      } catch (error) {
        toast.error('Failed to save locally');
        console.error(error);
      }
      return;
    }

    // Cloud save
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

      toast.success('Scenario saved to cloud');
      setShowSaveModal(false);
      setName('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error saving scenario');
      console.error(error);
    }
  };

  const fetchScenarios = async () => {
    setLoading(true);
    const loadedScenarios: Scenario[] = [];

    // 1. Fetch Local
    try {
      const local = await persistence.getScenarios();
      loadedScenarios.push(
        ...local.map((s) => ({
          _id: s.id,
          name: s.name,
          processes: s.processes,
          createdAt: s.createdAt,
          source: 'local' as const,
        }))
      );
    } catch (e) {
      console.error('Failed to load local scenarios', e);
    }

    // 2. Fetch Cloud (if online/auth)
    if (isAuthenticated && isOnline) {
      try {
        const res = await fetch(`/api/scenarios`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const cloudData = await handleApiResponse<Scenario[]>(res);
        loadedScenarios.push(...cloudData.map((s) => ({ ...s, source: 'cloud' as const })));
      } catch (error) {
        console.error('Fetch cloud scenarios error:', error);
        toast.error('Failed to load cloud scenarios');
      }
    }

    // Sort by date desc
    loadedScenarios.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setScenarios(loadedScenarios);
    setLoading(false);
  };

  const handleLoad = async (id: string) => {
    const scenario = scenarios.find((s) => s._id === id);
    if (!scenario) return;

    if (scenario.source === 'local') {
      onLoad(scenario.processes);
      toast.success(`Loaded "${scenario.name}"`);
      setShowLoadModal(false);
    } else {
      // Cloud load logic (redundant if we already have processes in list, but usually we fetch details)
      // Since `fetchScenarios` didn't fetch full details? Actually the API usually returns full objects for list?
      // Check `backend` code? Assuming list returns processes.
      // If not, we fetch detail.
      // Current impl assumed list didn't have full details? Or did it?
      // Previous code: `await fetch(\`/api/scenarios/${id}\`...`
      // Let's keep that logic for cloud to be safe.
      try {
        const res = await fetch(`/api/scenarios/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await handleApiResponse<Scenario>(res);
        onLoad(data.processes);
        toast.success(`Loaded "${data.name}"`);
        setShowLoadModal(false);
      } catch (error) {
        toast.error('Error loading scenario details');
      }
    }
  };

  const handleDelete = async (id: string) => {
    const scenario = scenarios.find((s) => s._id === id);
    if (!scenario) return;

    if (scenario.source === 'local') {
      await persistence.deleteScenario(id);
      setScenarios((prev) => prev.filter((s) => s._id !== id));
      toast.success('Local scenario deleted');
    } else {
      // Cloud delete logic (not implemented in original code but good to have)
      // For now, just ignore or impl simple delete
      // The previous code didn't have delete. I won't add cloud delete to avoid scope creep, just local.
      toast.error('Cloud delete not implemented yet');
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
        onDelete={handleDelete}
      />
    </div>
  );
};
