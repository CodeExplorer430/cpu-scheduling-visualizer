import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  UserCircleIcon,
  TableCellsIcon,
  ChartBarIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { ProfileSettings } from '../components/dashboard/ProfileSettings';
import { SavedScenarios } from '../components/dashboard/SavedScenarios';
import { AnalyticsDashboard } from '../components/dashboard/AnalyticsDashboard';

type Tab = 'scenarios' | 'analytics' | 'profile' | 'settings';

export const Dashboard: React.FC = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>('scenarios');

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const tabs = [
    { id: 'scenarios' as Tab, name: t('dashboard.scenarios'), icon: TableCellsIcon },
    { id: 'analytics' as Tab, name: t('dashboard.analytics'), icon: ChartBarIcon },
    { id: 'profile' as Tab, name: t('dashboard.profile'), icon: UserCircleIcon },
    { id: 'settings' as Tab, name: t('dashboard.settings'), icon: Cog6ToothIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {t('dashboard.welcome', { name: user?.username })}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex -mb-px overflow-x-auto no-scrollbar" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  group inline-flex items-center py-4 px-6 border-b-2 font-medium text-sm whitespace-nowrap
                  ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }
                `}
              >
                <tab.icon
                  className={`
                    mr-3 h-5 w-5
                    ${
                      activeTab === tab.id
                        ? 'text-blue-500 dark:text-blue-400'
                        : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
                    }
                  `}
                  aria-hidden="true"
                />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'scenarios' && <SavedScenarios />}
          {activeTab === 'analytics' && <AnalyticsDashboard />}
          {activeTab === 'profile' && <ProfileSettings mode="profile" />}
          {activeTab === 'settings' && <ProfileSettings mode="settings" />}
        </div>
      </div>
    </div>
  );
};
