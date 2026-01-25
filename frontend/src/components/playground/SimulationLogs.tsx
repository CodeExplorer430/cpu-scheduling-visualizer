import React, { useEffect, useRef } from 'react';

interface Props {
  logs?: string[];
}

export const SimulationLogs: React.FC<Props> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  if (!logs || logs.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Execution Log</h3>
      </div>
      <div
        ref={scrollRef}
        className="p-4 bg-gray-900 text-gray-100 font-mono text-xs h-64 overflow-y-auto"
      >
        {logs.map((log, index) => (
          <div key={index} className="mb-1 border-b border-gray-800 pb-1 last:border-0 last:pb-0">
            <span className="text-gray-500 mr-2">[{index + 1}]</span>
            {log}
          </div>
        ))}
      </div>
    </div>
  );
};
