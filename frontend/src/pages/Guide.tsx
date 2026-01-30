import React from 'react';
import { useTranslation } from 'react-i18next';
import { 
  BookOpenIcon, 
  BeakerIcon, 
  ArrowsRightLeftIcon, 
  AcademicCapIcon,
  PlusIcon,
  PlayIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';
import { Card } from '../components/common/Card';

export const Guide: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-fade-in pb-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-3">
          <BookOpenIcon className="w-10 h-10 text-blue-600" />
          {t('nav.guide')}
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Master the Quantix platform with this step-by-step tutorial on scheduling simulations and analysis.
        </p>
      </div>

      {/* Playground Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
          <BeakerIcon className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Using the Playground</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">1</span>
              Define Your Processes
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Use the <strong>Process List</strong> table to add tasks. Click the <PlusIcon className="w-4 h-4 inline" /> <strong>Add Process</strong> button to create new rows.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-500 dark:text-gray-500 ml-4 space-y-1">
              <li><strong>PID:</strong> A unique identifier for the process.</li>
              <li><strong>Arrival:</strong> When the process enters the ready queue.</li>
              <li><strong>Burst:</strong> Total CPU time required.</li>
              <li><strong>Priority:</strong> Used by priority-based algorithms (lower = higher).</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">2</span>
              Configure & Run
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Select an algorithm from the dropdown in the <strong>Simulation Control</strong> panel. Adjust cores and context switch overhead as needed.
            </p>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded text-sm text-blue-800 dark:text-blue-300 border border-blue-100 dark:border-blue-800">
              <strong>Tip:</strong> For Round Robin, click "Optimize" to let Quantix find the best Time Quantum for your process set!
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">3</span>
              Analyze Step-by-Step
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Once you click <PlayIcon className="w-4 h-4 inline" /> <strong>Run Simulation</strong>, use the <strong>Time Control</strong> slider or buttons to step through execution.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Watch the <strong>Algorithm Decision Logic</strong> (Step Explainer) to understand exactly <em>why</em> a specific process was chosen at every millisecond.
            </p>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white text-xs">4</span>
              Persistence
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Logged-in users can <strong>Save</strong> and <strong>Load</strong> scenarios using the cloud buttons at the top of the process table. Never lose your test cases again!
            </p>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
          <ArrowsRightLeftIcon className="w-8 h-8 text-purple-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Comparing Algorithms</h2>
        </div>
        
        <Card className="bg-purple-50 dark:bg-purple-900/10 border-purple-100 dark:border-purple-900/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="col-span-2 space-y-4">
              <p className="text-gray-700 dark:text-gray-300">
                The <strong>Compare</strong> page allows you to evaluate all supported algorithms simultaneously on the exact same dataset.
              </p>
              <ul className="space-y-3">
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Visual Stack:</strong> View multiple Gantt charts stacked vertically, perfectly aligned in time.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Metrics Table:</strong> Compare Average Waiting Time, Turnaround Time, and Context Switches in a single table.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-600 font-bold">•</span>
                  <span><strong>Export:</strong> Download your entire comparison as a <strong>PNG</strong> or <strong>PDF</strong> for assignments or documentation.</span>
                </li>
              </ul>
            </div>
            <div className="flex flex-col justify-center items-center p-4 bg-white dark:bg-gray-800 rounded-lg shadow-inner">
              <DocumentArrowDownIcon className="w-12 h-12 text-gray-400 mb-2" />
              <span className="text-xs font-bold text-gray-500 uppercase">Exportable Reports</span>
            </div>
          </div>
        </Card>
      </section>

      {/* Auto-Grader Section */}
      <section className="space-y-6">
        <div className="flex items-center gap-3 border-b border-gray-200 dark:border-gray-700 pb-2">
          <AcademicCapIcon className="w-8 h-8 text-green-600" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Auto-Grader for Students</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">How it works</h3>
            <p className="text-gray-600 dark:text-gray-400">
              Verification at scale. The Auto-Grader takes a JSON file of test cases, runs them through the deterministic engine, and compares the actual results against your expectations.
            </p>
            <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-2 ml-2">
              <li>Download the <strong>Example JSON</strong> to see the required format.</li>
              <li>Add your processes and expected average metrics.</li>
              <li>Upload the file and click <strong>Run Tests</strong>.</li>
            </ol>
          </div>

          <div className="bg-gray-900 rounded-lg p-4 font-mono text-[10px] sm:text-xs text-green-400 overflow-x-auto shadow-2xl">
            <p className="text-gray-500 mb-2">// Sample Test Case</p>
            <pre>{`{
  "id": "tc-1",
  "algorithm": "RR",
  "processes": [...],
  "expected": {
    "avgTurnaround": 7.5,
    "avgWaiting": 3.0
  }
}`}</pre>
          </div>
        </div>
      </section>

      {/* Closing Card */}
      <Card className="text-center bg-blue-600 text-white p-8">
        <h2 className="text-2xl font-bold mb-2">Ready to Start?</h2>
        <p className="opacity-90 mb-6">Head over to the playground and start experimenting with scheduling logic.</p>
        <a 
          href="/" 
          className="inline-block bg-white text-blue-600 font-bold px-8 py-3 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
        >
          Go to Playground
        </a>
      </Card>
    </div>
  );
};
