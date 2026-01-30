import React from 'react';
import { AutoGradeReport, TestCase } from '@cpu-vis/shared';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface Props {
  report: AutoGradeReport;
  testCases: TestCase[];
}

export const GradeResultsTable: React.FC<Props> = ({ report, testCases }) => {
  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
      <div className="p-4 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white">Results</h3>
        <span
          className={`px-3 py-1 rounded-full text-sm font-bold ${
            report.score === 100
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}
        >
          Score: {report.score.toFixed(1)}% ({report.passedTests}/{report.totalTests})
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                ID / Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Algorithm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actual vs Expected (Avg TAT)
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Actual vs Expected (Avg WT)
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {report.results.map((result) => (
              <tr key={result.testCaseId}>
                <td className="px-6 py-4 whitespace-nowrap">
                  {result.passed ? (
                    <CheckCircleIcon className="w-6 h-6 text-green-500" />
                  ) : (
                    <XCircleIcon className="w-6 h-6 text-red-500" />
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {result.testCaseId}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {testCases.find((tc) => tc.id === result.testCaseId)?.description}
                  </div>
                  {result.error && <div className="text-xs text-red-600 mt-1">{result.error}</div>}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-300">
                  {testCases.find((tc) => tc.id === result.testCaseId)?.algorithm}
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-white font-mono">
                      {result.actualMetrics.avgTurnaround.toFixed(2)}
                    </span>
                    {result.expectedMetrics?.avgTurnaround !== undefined && (
                      <span className="text-gray-500 text-xs">
                        Exp: {result.expectedMetrics.avgTurnaround.toFixed(2)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm">
                  <div className="flex flex-col">
                    <span className="text-gray-900 dark:text-white font-mono">
                      {result.actualMetrics.avgWaiting.toFixed(2)}
                    </span>
                    {result.expectedMetrics?.avgWaiting !== undefined && (
                      <span className="text-gray-500 text-xs">
                        Exp: {result.expectedMetrics.avgWaiting.toFixed(2)}
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
