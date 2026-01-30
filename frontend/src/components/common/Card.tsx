import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: string;
}

export const Card: React.FC<CardProps> = ({ children, className = '', padding = 'p-6' }) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-lg shadow transition-colors duration-200 ${padding} ${className}`}
    >
      {children}
    </div>
  );
};
