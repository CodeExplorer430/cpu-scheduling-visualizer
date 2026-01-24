import React from 'react';

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
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow space-y-4 transition-colors duration-200">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          Simulation Control
        </h3>
        <span className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
          Time: {currentTime} / {maxTime}
        </span>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex-1 py-2 px-4 rounded font-bold text-white transition-colors ${
            isPlaying ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            onTimeChange(Math.max(0, currentTime - 1));
          }}
          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 p-2 rounded text-gray-700"
          disabled={currentTime === 0}
        >
          <span className="hidden sm:inline">Step Back</span>
          <span className="sm:hidden">←</span>
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            onTimeChange(Math.min(maxTime, currentTime + 1));
          }}
          className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-200 p-2 rounded text-gray-700"
          disabled={currentTime >= maxTime}
        >
          <span className="hidden sm:inline">Step Forward</span>
          <span className="sm:hidden">→</span>
        </button>

        <button
          onClick={() => {
            setIsPlaying(false);
            onTimeChange(0);
          }}
          className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-400 p-2 rounded text-gray-500 text-xs"
        >
          Reset
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
