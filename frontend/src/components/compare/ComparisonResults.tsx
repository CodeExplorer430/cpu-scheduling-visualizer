import React, { useMemo, useRef } from 'react';
import { SimulationResult, Algorithm } from '@cpu-vis/shared';
import { Gantt } from '../GanttChart/Gantt';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

interface Props {
  results: Record<Algorithm, SimulationResult>;
  algorithms: Algorithm[];
}

export const ComparisonResults: React.FC<Props> = ({ results, algorithms }) => {
  const exportRef = useRef<HTMLDivElement>(null);
  const { t } = useTranslation();

  // Calculate global max time across all algorithms to synchronize scales
  const domainMax = useMemo(() => {
    let max = 0;
    algorithms.forEach((algo) => {
      const events = results[algo].events;
      if (events.length > 0) {
        const lastEvent = events[events.length - 1];
        if (lastEvent.end > max) max = lastEvent.end;
      }
    });
    return max;
  }, [results, algorithms]);

  const handleExportPNG = async () => {
    if (!exportRef.current) return;

    const exportPromise = (async () => {
      const canvas = await html2canvas(exportRef.current!, {
        scale: 2, // Higher resolution
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Force white background
        windowWidth: 1280, // Force desktop width for mobile export
        onclone: (clonedDoc) => {
          const container = clonedDoc.getElementById('comparison-export-container');
          if (container) {
            container.style.width = '1280px';
            // Ensure no overflow hiding prevents full capture
            container.style.overflow = 'visible';
          }
        },
      });
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = 'quantix-comparison.png';
      link.click();
    })();

    toast.promise(exportPromise, {
      loading: t('common.loading'),
      success: t('compare.export') + ' PNG!',
      error: t('common.error'),
    });
  };

  const handleExportPDF = async () => {
    if (!exportRef.current) return;

    const exportPromise = (async () => {
      const canvas = await html2canvas(exportRef.current!, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1280,
        onclone: (clonedDoc) => {
          const container = clonedDoc.getElementById('comparison-export-container');
          if (container) {
            container.style.width = '1280px';
            container.style.overflow = 'visible';
          }
        },
      });
      const imgData = canvas.toDataURL('image/png');

      // A4 size: 210 x 297 mm
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('quantix-comparison.pdf');
    })();

    toast.promise(exportPromise, {
      loading: t('common.loading'),
      success: t('compare.export') + ' PDF!',
      error: t('common.error'),
    });
  };

  return (
    <div className="space-y-8">
      {/* Actions */}
      <div className="flex justify-end gap-4">
        <button
          onClick={handleExportPNG}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded shadow transition-colors"
        >
          {t('compare.export')} PNG
        </button>
        <button
          onClick={handleExportPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded shadow transition-colors"
        >
          {t('compare.export')} PDF
        </button>
      </div>

      <div
        id="comparison-export-container"
        ref={exportRef}
        className="space-y-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl"
      >
        {/* Metrics Comparison Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden transition-colors duration-200">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200">
              {t('metrics.title')}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-left text-gray-500 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-medium">
                <tr>
                  <th className="px-6 py-3">{t('controls.algorithm')}</th>
                  <th className="px-6 py-3">{t('metrics.avgTurnaround')}</th>
                  <th className="px-6 py-3">{t('metrics.avgWait')}</th>
                  <th className="px-6 py-3">{t('metrics.switches')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {algorithms.map((algo) => (
                  <tr
                    key={algo}
                    className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <td className="px-6 py-3 font-bold text-gray-900 dark:text-white">
                      {t(`controls.algorithms.${algo}`)}
                    </td>
                    <td className="px-6 py-3">{results[algo].metrics.avgTurnaround.toFixed(2)}</td>
                    <td className="px-6 py-3">{results[algo].metrics.avgWaiting.toFixed(2)}</td>
                    <td className="px-6 py-3">{results[algo].metrics.contextSwitches ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Gantt Stack - Synchronized Vertical Alignment */}
        <div className="flex flex-col gap-6">
          {algorithms.map((algo) => (
            <div
              key={algo}
              className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow transition-colors duration-200"
            >
              <h4 className="text-md font-bold mb-2 text-gray-700 dark:text-gray-200">
                {t(`controls.algorithms.${algo}`)}
              </h4>
              <Gantt events={results[algo].events} domainMax={domainMax} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
