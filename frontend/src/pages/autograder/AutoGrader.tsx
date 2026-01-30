import React, { useState } from 'react';
import {
  runAutoGrader,
  TestCase,
  AutoGradeReport,
} from '@cpu-vis/shared';
import toast from 'react-hot-toast';
import {
  DocumentCheckIcon,
  ArrowUpTrayIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

export const AutoGrader: React.FC = () => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [report, setReport] = useState<AutoGradeReport | null>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);
        // Basic validation
        if (!Array.isArray(json)) throw new Error('Expected an array of test cases');
        setTestCases(json);
        setReport(null);
        toast.success(`Loaded ${json.length} test cases`);
      } catch (error) {
        console.error(error);
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
  };

  const runTests = () => {
    if (testCases.length === 0) return;
    const result = runAutoGrader(testCases);
    setReport(result);
    if (result.passedTests === result.totalTests) {
      toast.success('All tests passed! 🎉');
    } else {
      toast('Some tests failed.', { icon: '⚠️' });
    }
  };

  const downloadExample = () => {
    const example: TestCase[] = [
      {
        id: 'tc-1',
        description: 'Basic FCFS Check',
        algorithm: 'FCFS',
        processes: [
          { pid: 'P1', arrival: 0, burst: 5 },
          { pid: 'P2', arrival: 2, burst: 3 },
        ],
        expected: {
          avgTurnaround: 5.5,
          avgWaiting: 1.5,
        },
      },
      {
        id: 'tc-2',
        description: 'Round Robin Quantum 2',
        algorithm: 'RR',
        processes: [
          { pid: 'P1', arrival: 0, burst: 5 },
          { pid: 'P2', arrival: 1, burst: 4 },
        ],
        options: { quantum: 2 },
        expected: {
          avgTurnaround: 7.5,
          avgWaiting: 3.0,
        },
      },
    ];
    const blob = new Blob([JSON.stringify(example, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'test-cases-example.json';
    link.click();
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
          <DocumentCheckIcon className="w-8 h-8 text-blue-600" />
          Auto-Grader
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Upload a JSON file containing test cases to verify algorithm correctness. Great for
          students or verifying implementation details.
        </p>

        <div className="flex flex-wrap gap-4">
          <label className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow cursor-pointer flex items-center gap-2 transition-colors">
            <ArrowUpTrayIcon className="w-5 h-5" />
            Upload Test Cases
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          <button
            onClick={downloadExample}
            className="bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2 rounded shadow transition-colors flex items-center gap-2"
          >
            Download Example
          </button>

          {testCases.length > 0 && (
            <button
              onClick={runTests}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition-colors flex items-center gap-2 ml-auto"
            >
              <ClipboardDocumentCheckIcon className="w-5 h-5" />
              Run Tests
            </button>
          )}
        </div>
      </div>

      {report && (
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
                      {result.error && (
                        <div className="text-xs text-red-600 mt-1">{result.error}</div>
                      )}
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
      )}
    </div>
  );
};
