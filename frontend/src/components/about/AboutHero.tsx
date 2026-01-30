import React from 'react';

export const AboutHero: React.FC = () => {
  return (
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
  );
};
