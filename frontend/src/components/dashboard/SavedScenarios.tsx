import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { TrashIcon, PlayIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { handleApiResponse } from '../../lib/api';

interface ScenarioSummary {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
}

export const SavedScenarios: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScenarios = useCallback(async () => {
    try {
      const res = await fetch('/api/scenarios', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await handleApiResponse<ScenarioSummary[]>(res);
      setScenarios(data);
    } catch (error) {
      console.error('Fetch scenarios error:', error);
      toast.error(error instanceof Error ? error.message : t('dashboard.errors.fetchScenarios'));
    } finally {
      setLoading(false);
    }
  }, [token, t]);

  useEffect(() => {
    if (token) {
      fetchScenarios();
    }
  }, [token, fetchScenarios]);

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('dashboard.confirmDelete'))) return;

    try {
      const res = await fetch(`/api/scenarios/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      await handleApiResponse(res);

      toast.success(t('dashboard.success.deleted'));
      setScenarios(scenarios.filter((s) => s._id !== id));
    } catch (error) {
      console.error('Delete scenario error:', error);
      toast.error(error instanceof Error ? error.message : t('dashboard.errors.deleteFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (scenarios.length === 0) {
    return (
      <div className="text-center py-12">
        <TableCellsIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {t('dashboard.noScenarios')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('dashboard.createOnePrompt')}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            {t('dashboard.goToPlayground')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {scenarios.map((scenario) => (
        <div
          key={scenario._id}
          className="relative bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600 hover:border-blue-300 dark:hover:border-blue-500 transition-all group"
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate pr-8">
              {scenario.name}
            </h3>
            <button
              onClick={() => handleDelete(scenario._id)}
              className="text-gray-400 hover:text-red-500 transition-colors p-1"
              title={t('common.delete')}
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 h-10 mb-4">
            {scenario.description || t('dashboard.noDescription')}
          </p>

          <div className="flex items-center text-xs text-gray-400 dark:text-gray-500 mb-6">
            <CalendarIcon className="h-3.5 w-3.5 mr-1" />
            {new Date(scenario.createdAt).toLocaleDateString()}
          </div>

          <div className="flex space-x-2">
            <Link
              to={`/?scenarioId=${scenario._id}`}
              className="flex-1 inline-flex justify-center items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <PlayIcon className="h-4 w-4 mr-1.5" />
              {t('common.load')}
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
};

// Helper for empty state icon
const TableCellsIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
    />
  </svg>
);
