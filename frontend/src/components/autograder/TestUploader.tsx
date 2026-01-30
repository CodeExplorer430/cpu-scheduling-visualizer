import React from 'react';
import toast from 'react-hot-toast';
import { 
  DocumentCheckIcon, 
  ArrowUpTrayIcon, 
  ClipboardDocumentCheckIcon 
} from '@heroicons/react/24/outline';
import { TestCase } from '@cpu-vis/shared';

interface Props {
  onTestCasesLoad: (testCases: TestCase[]) => void;
  onRunTests: () => void;
  testCasesCount: number;
}

export const TestUploader: React.FC<Props> = ({ onTestCasesLoad, onRunTests, testCasesCount }) => {
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const json = JSON.parse(content);
        if (!Array.isArray(json)) throw new Error('Expected an array of test cases');
        onTestCasesLoad(json);
        toast.success(`Loaded ${json.length} test cases`);
      } catch (error) {
        console.error(error);
        toast.error('Invalid JSON file');
      }
    };
    reader.readAsText(file);
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

        {testCasesCount > 0 && (
          <button
            onClick={onRunTests}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded shadow transition-colors flex items-center gap-2 ml-auto"
          >
            <ClipboardDocumentCheckIcon className="w-5 h-5" />
            Run Tests
          </button>
        )}
      </div>
    </div>
  );
};
