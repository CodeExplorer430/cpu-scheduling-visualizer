import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  PlayIcon, 
  PauseIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  ArrowPathIcon 
} from '@heroicons/react/24/outline';

interface Props {
  currentTime: number;
  maxTime: number;
  onTimeChange: (time: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
}

export const Stepper: React.FC<Props> = ({
  currentTime,
  maxTime,
  onTimeChange,
  isPlaying,
  setIsPlaying,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          {t('common.time')} Control
        </h3>
        <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
          {t('common.time')}: {currentTime} / {maxTime}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex-1 py-2 px-4 rounded font-bold text-white transition-colors flex items-center justify-center gap-2 ${
            isPlaying ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isPlaying ? (
            <>
              <PauseIcon className="w-5 h-5" />
              {t('common.pause')}
            </>
          ) : (
            <>
              <PlayIcon className="w-5 h-5" />
              {t('common.play')}
            </>
          )}
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            onTimeChange(Math.max(0, currentTime - 1));
          }}
          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 p-2 rounded text-gray-700 flex items-center gap-1"
          disabled={currentTime === 0}
        >
          <ChevronLeftIcon className="w-5 h-5" />
          <span className="hidden sm:inline text-xs font-semibold">{t('common.stepBack')}</span>
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            onTimeChange(Math.min(maxTime, currentTime + 1));
          }}
          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 p-2 rounded text-gray-700 flex items-center gap-1"
          disabled={currentTime >= maxTime}
        >
          <span className="hidden sm:inline text-xs font-semibold">{t('common.stepForward')}</span>
          <ChevronRightIcon className="w-5 h-5" />
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            onTimeChange(0);
          }}
          className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-400 p-2 rounded text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          title={t('common.reset')}
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
      </div>

      <input
        type="range"
        min="0"
        max={maxTime}
        value={currentTime}
        onChange={(e) => onTimeChange(parseInt(e.target.value))}
        className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-600 dark:accent-blue-500"
      />
    </div>
  );
};
