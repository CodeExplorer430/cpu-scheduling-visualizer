import React from 'react';
import { Card } from '../common/Card';

export const AboutMission: React.FC = () => {
  return (
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
  );
};
