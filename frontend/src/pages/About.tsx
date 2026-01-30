import React from 'react';
import { Card } from '../components/common/Card';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-6">
          <img src="/logo.svg" alt="Quantix Logo" className="w-24 h-24 sm:w-32 sm:h-32" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400">
          Quantix
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          A powerful, deterministic CPU scheduling visualizer designed for students, educators, and
          system enthusiasts.
        </p>
      </div>

      {/* Mission */}
      <Card>
        <div className="prose dark:prose-invert max-w-none">
          <h2 className="text-2xl font-bold mb-4 flex items-center text-gray-900 dark:text-white">
            <span className="text-blue-500 mr-2">Our</span> Mission
          </h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            Operating Systems concepts can be abstract and difficult to grasp.{' '}
            <strong>Quantix</strong> bridges the gap between theory and practice by providing a
            visual, interactive platform to explore how CPU schedulers work under the hood. Whether
            you're analyzing the efficiency of Round Robin or the complexity of Multilevel Feedback
            Queues, Quantix offers a deterministic engine to verify your understanding.
          </p>
        </div>
      </Card>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
            Visual Simulation
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Watch algorithms execute step-by-step with real-time Gantt charts and state transitions.
            Pause, rewind, and inspect the state of every process at any millisecond.
          </p>
        </Card>
        <Card>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
            Algorithm Comparison
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Run different algorithms side-by-side on the same dataset. Compare waiting times,
            turnaround times, and context switch overheads instantly.
          </p>
        </Card>
        <Card>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Energy Modeling</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Go beyond standard metrics. Quantix simulates energy consumption, tracking active vs.
            idle power usage to help understand the environmental impact of scheduling decisions.
          </p>
        </Card>
        <Card>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Detailed Logs</h3>
          <p className="text-gray-600 dark:text-gray-400">
            Confused why process P1 ran before P2? Our unique "Step Explainer" provides
            human-readable reasoning for every scheduling decision made by the engine.
          </p>
        </Card>
      </div>

      {/* Algorithms List */}
      <Card>
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
          Supported Algorithms
        </h3>
        <div className="flex flex-wrap gap-2">
          {[
            'First-Come, First-Served (FCFS)',
            'Shortest Job First (SJF)',
            'Shortest Remaining Time First (SRTF)',
            'Round Robin (RR)',
            'Priority (Preemptive & Non-Preemptive)',
            'Longest Job First (LJF)',
            'Longest Remaining Time First (LRTF)',
            'Highest Response Ratio Next (HRRN)',
            'Multilevel Queue (MQ)',
            'Multilevel Feedback Queue (MLFQ)',
          ].map((algo) => (
            <span
              key={algo}
              className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-medium"
            >
              {algo}
            </span>
          ))}
        </div>
      </Card>

      {/* Team / Open Source */}
      <Card>
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Author & Open Source</h2>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
            I am <strong>Miguel Harvey Velasco</strong>, a third-year BSIT student. I originally
            developed Quantix to streamline the complex manual computations required for my{' '}
            <strong>CCS 112: Operating System & Application</strong> course. While traditional
            pen-and-paper calculations are essential for learning, I saw an opportunity to build a
            tool that lessens the "manual labor" for myself and my classmates.
          </p>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl mx-auto">
            What started as a personal project to solve my own challenges soon became a mission to
            help others. By open-sourcing Quantix, I hope to provide students and tech enthusiasts
            worldwide with a clear, interactive way to visualize and truly master the inner workings
            of CPU scheduling algorithms.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-4">
            <a
              href="https://github.com/CodeExplorer430/quantix"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              View on GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/miguel-harvey-velasco-07995b251"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-md shadow-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Connect on LinkedIn
            </a>
          </div>
        </div>
      </Card>
    </div>
  );
};
