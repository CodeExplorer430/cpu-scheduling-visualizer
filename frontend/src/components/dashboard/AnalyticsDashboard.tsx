import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ChartPieIcon,
  BoltIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';

interface Stat {
  _id: string;
  count: number;
  avgWaitTime: number;
  avgTurnaroundTime: number;
}

interface AnalyticsData {
  history: any[];
  stats: Stat[];
}

export const AnalyticsDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { token } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch('/api/user/analytics', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setData(await res.json());
        }
      } catch (error) {
        console.error('Fetch analytics error:', error);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchAnalytics();
    }
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data || data.stats.length === 0) {
    return (
      <div className="text-center py-12">
        <ChartPieIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
          {t('dashboard.noAnalytics')}
        </h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('dashboard.runSimulationPrompt')}
        </p>
      </div>
    );
  }

  const totalSimulations = data.stats.reduce((acc, curr) => acc + curr.count, 0);
  const mostUsedAlgo = [...data.stats].sort((a, b) => b.count - a.count)[0];

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-5 rounded-lg border border-blue-100 dark:border-blue-800">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
              <BoltIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {t('dashboard.totalSimulations')}
                </dt>
                <dd className="text-lg font-bold text-gray-900 dark:text-white">
                  {totalSimulations}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-lg border border-green-100 dark:border-green-800">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
              <ArrowTrendingUpIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {t('dashboard.mostUsed')}
                </dt>
                <dd className="text-lg font-bold text-gray-900 dark:text-white">
                  {mostUsedAlgo._id}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-lg border border-purple-100 dark:border-purple-800">
          <div className="flex items-center">
            <div className="flex-shrink-0 bg-purple-500 rounded-md p-3">
              <ClockIcon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                  {t('dashboard.avgWait')}
                </dt>
                <dd className="text-lg font-bold text-gray-900 dark:text-white">
                  {(
                    data.stats.reduce((acc, curr) => acc + curr.avgWaitTime, 0) / data.stats.length
                  ).toFixed(2)}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Algorithm Performance Table */}
      <div className="mt-8">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('dashboard.algoPerformance')}
        </h3>
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('dashboard.algorithm')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('dashboard.runs')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('dashboard.avgWaitTime')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {t('dashboard.avgTurnaround')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {data.stats.map((stat) => (
                <tr key={stat._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {stat._id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {stat.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {stat.avgWaitTime.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    {stat.avgTurnaroundTime.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
