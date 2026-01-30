import React from 'react';
import { Link } from 'react-router-dom';
import { OAuthButtons } from './OAuthButtons';

interface Props {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerLinkText: string;
  footerLinkTo: string;
  onSubmit: (e: React.FormEvent) => void;
}

export const AuthCard: React.FC<Props> = ({
  title,
  subtitle,
  children,
  footerLinkText,
  footerLinkTo,
  onSubmit,
}) => {
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-colors">
        <div className="text-center">
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {subtitle}
            </p>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={onSubmit}>
          {children}

          <OAuthButtons />

          <div className="text-sm text-center">
            <Link
              to={footerLinkTo}
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400"
            >
              {footerLinkText}
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};
