import React from 'react';
import { Card } from '../common/Card';

export const FeaturesGrid: React.FC = () => {
  const features = [
    {
      title: 'Visual Simulation',
      description: 'Watch algorithms execute step-by-step with real-time Gantt charts and state transitions. Pause, rewind, and inspect the state of every process at any millisecond.'
    },
    {
      title: 'Algorithm Comparison',
      description: 'Run different algorithms side-by-side on the same dataset. Compare waiting times, turnaround times, and context switch overheads instantly.'
    },
    {
      title: 'Energy Modeling',
      description: 'Go beyond standard metrics. Quantix simulates energy consumption, tracking active vs. idle power usage to help understand the environmental impact of scheduling decisions.'
    },
    {
      title: 'Detailed Logs',
      description: 'Confused why process P1 ran before P2? Our unique "Step Explainer" provides human-readable reasoning for every scheduling decision made by the engine.'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {features.map((feature) => (
        <Card key={feature.title}>
          <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
            {feature.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {feature.description}
          </p>
        </Card>
      ))}
    </div>
  );
};
