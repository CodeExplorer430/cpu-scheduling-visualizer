import React from 'react';
import { Card } from '../common/Card';

export const AboutAuthor: React.FC = () => {
  return (
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
  );
};
