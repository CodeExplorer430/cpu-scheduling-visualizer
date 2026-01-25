import React, { useEffect, useRef } from 'react';
import { DecisionLog } from '@cpu-vis/shared';
import { useTranslation } from 'react-i18next';

interface Props {
  stepLogs: DecisionLog[];
  currentTime: number;
}

export const StepExplainer: React.FC<Props> = ({ stepLogs, currentTime }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();
  
  // Filter logs up to current time
  const currentLogs = stepLogs.filter(log => log.time <= currentTime);
  
  // Auto-scroll to bottom when logs update or time changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentLogs.length, currentTime]);

  if (currentLogs.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 text-center text-gray-500 dark:text-gray-400">
        {t('explainer.noDecisions')}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200 flex flex-col h-96">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-gray-900">
        <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center">
          <span className="mr-2">🧠</span> {t('explainer.title')}
        </h3>
        <p className="text-sm text-blue-700 dark:text-blue-300 opacity-80">
          {t('explainer.subtitle', { time: currentTime })}
        </p>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50"
      >
        {currentLogs.map((log, index) => {
            const isLatest = index === currentLogs.length - 1;
            return (
                <div 
                    key={`${log.time}-${log.coreId}-${index}`}
                    className={`
                        relative border-l-4 rounded-r-lg p-4 shadow-sm
                        ${isLatest 
                            ? 'bg-white dark:bg-gray-800 border-green-500 ring-2 ring-green-500/20' 
                            : 'bg-white/80 dark:bg-gray-800/80 border-gray-300 dark:border-gray-600 opacity-70'}
                    `}
                >
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                            {t('common.time')}: {log.time}
                        </span>
                        <span className="text-xs font-mono text-gray-400">{t('explainer.core')} {log.coreId}</span>
                    </div>
                    
                    <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">
                        {log.message}
                    </h4>
                    
                    <div className="text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-900/30">
                        <span className="font-semibold text-blue-800 dark:text-blue-300">{t('explainer.reason')}:</span> {log.reason}
                    </div>

                    {log.queueState.length > 0 && (
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="font-semibold">{t('explainer.queue')}:</span> [{log.queueState.join(', ')}]
                        </div>
                    )}
                </div>
            );
        })}
      </div>
    </div>
  );
};
