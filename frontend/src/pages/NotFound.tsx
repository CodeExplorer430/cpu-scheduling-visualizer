import React from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <Helmet>
        <title>404 - Page Not Found | Quantix</title>
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      
      <div className="bg-red-50 dark:bg-red-900/20 p-6 rounded-full mb-6">
        <ExclamationTriangleIcon className="w-16 h-16 text-red-600 dark:text-red-400" />
      </div>
      
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
        404 - Page Not Found
      </h1>
      
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-md">
        The page you are looking for might have been moved, deleted, or never existed in the first place.
      </p>
      
      <Link
        to="/"
        className="bg-blue-600 text-white font-bold px-8 py-3 rounded-full hover:bg-blue-500 transition-all shadow-lg"
      >
        Return to Playground
      </Link>
    </div>
  );
};
