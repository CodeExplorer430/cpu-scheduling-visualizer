import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuth, User } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { handleApiResponse } from '../../lib/api';

interface ProfileSettingsProps {
  mode: 'profile' | 'settings';
}

interface UserSettings {
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  defaultAlgorithm?: string;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ mode }) => {
  const { t, i18n } = useTranslation();
  const { user, token, updateUser } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [loading, setLoading] = useState(false);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ username, bio }),
      });

      const updatedUser = await handleApiResponse<User>(res);
      updateUser(updatedUser);
      toast.success(t('dashboard.success.profileUpdated'));
    } catch (error) {
      console.error('Update profile error:', error);
      toast.error(error instanceof Error ? error.message : t('dashboard.errors.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (newSettings: UserSettings) => {
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newSettings),
      });

      const settings = await handleApiResponse<UserSettings>(res);
      // Update user context with new settings
      if (user) {
        updateUser({ ...user, settings });
      }
      toast.success(t('dashboard.success.settingsUpdated'));
    } catch (error) {
      console.error('Update settings error:', error);
      toast.error(error instanceof Error ? error.message : t('dashboard.errors.updateFailed'));
    }
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
    handleUpdateSettings({ language: lang });
  };

  if (mode === 'profile') {
    return (
      <form onSubmit={handleUpdateProfile} className="max-w-md space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('common.username')}
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('dashboard.bio')}
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm dark:text-white"
            placeholder={t('dashboard.bioPlaceholder')}
          />
          <p className="mt-2 text-xs text-gray-500">{t('dashboard.bioLimit')}</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {loading ? t('common.saving') : t('common.saveChanges')}
        </button>
      </form>
    );
  }

  return (
    <div className="max-w-md space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('dashboard.appearance')}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('dashboard.theme')}</span>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200"
          >
            {theme === 'light' ? t('dashboard.switchToDark') : t('dashboard.switchToLight')}
          </button>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {t('dashboard.language')}
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => changeLanguage('en')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              i18n.language === 'en'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            English
          </button>
          <button
            onClick={() => changeLanguage('es')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              i18n.language === 'es'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            Español
          </button>
        </div>
      </div>
    </div>
  );
};
