import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

// Headless UI is typically used for accessible modals, but since it wasn't in the original package.json,
// I'll implement a custom one similar to the original TutorialModal to avoid adding new dependencies
// unless I check package.json first. The original used a custom implementation.
// Let's stick to the custom implementation for now to be safe, but generic.

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  maxWidth = 'max-w-2xl',
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      {/* Backdrop click handler */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      
      <div
        className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl w-full ${maxWidth} max-h-[90vh] flex flex-col transform transition-all scale-100 relative z-10`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex justify-between items-center mb-4 border-b dark:border-gray-700 pb-3">
          <h3 className="text-xl font-bold dark:text-white flex items-center gap-2">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Close"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">{children}</div>

        {footer && (
          <div className="mt-6 flex justify-end border-t dark:border-gray-700 pt-4 gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
