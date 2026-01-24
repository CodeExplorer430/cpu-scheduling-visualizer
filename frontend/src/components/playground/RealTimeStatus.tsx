import React from 'react';
import { Snapshot } from '@cpu-vis/shared';

interface Props {
  snapshot?: Snapshot;
  currentTime: number;
  maxTime: number;
}

export const RealTimeStatus: React.FC<Props> = ({ snapshot, currentTime, maxTime }) => {
  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow border-l-4 border-blue-500 flex justify-between items-center transition-colors duration-200">
      <div>
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">
          Currently Running
        </p>
        <p className="text-2xl font-bold text-gray-800 dark:text-white">
          {snapshot?.runningPid || (currentTime >= maxTime ? 'FINISHED' : 'IDLE')}
        </p>
      </div>
      <div className="text-right">
        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase">Ready Queue</p>
        <div className="flex space-x-1 mt-1">
          {snapshot?.readyQueue.map((pid) => (
            <span
              key={pid}
              className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold px-2 py-1 rounded border border-blue-200 dark:border-blue-800"
            >
              {pid}
            </span>
          ))}
          {!snapshot?.readyQueue.length && (
            <span className="text-gray-300 dark:text-gray-600 text-sm italic">Empty</span>
          )}
        </div>
      </div>
    </div>
  );
};
