import React from 'react';
import { Process } from '@cpu-vis/shared';
import { Modal } from './common/Modal/Modal';
import { Button } from './common/Button/Button';

interface Props {
  isOpen: boolean;
  processes: Process[];
  warnings: string[];
  onClose: () => void;
  onConfirm: () => void;
}

export const OcrReviewModal: React.FC<Props> = ({
  isOpen,
  processes,
  warnings,
  onClose,
  onConfirm,
}) => (
  <Modal
    isOpen={isOpen}
    onClose={onClose}
    title="Review OCR Import"
    maxWidth="max-w-5xl"
    footer={
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Replace Process Table
        </Button>
      </>
    }
  >
    <div className="space-y-4">
      {warnings.length > 0 && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">Warnings</p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            {warnings.map((warning, index) => (
              <li key={`${warning}-${index}`}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              {[
                'PID',
                'Arrival',
                'Burst',
                'Priority',
                'Tickets',
                'Share Group',
                'Share Weight',
                'Deadline',
                'Period',
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-200"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white dark:bg-gray-800 dark:divide-gray-700">
            {processes.map((process) => (
              <tr key={process.pid}>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{process.pid}</td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{process.arrival}</td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{process.burst}</td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{process.priority}</td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{process.tickets}</td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{process.shareGroup}</td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">
                  {process.shareWeight}
                </td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{process.deadline}</td>
                <td className="px-3 py-2 text-gray-900 dark:text-gray-100">{process.period}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </Modal>
);
