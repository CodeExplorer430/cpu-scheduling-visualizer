import React, { useState } from 'react';
import { runAutoGrader, TestCase, AutoGradeReport } from '@cpu-vis/shared';
import toast from 'react-hot-toast';
import { TestUploader } from '../../components/autograder/TestUploader';
import { GradeResultsTable } from '../../components/autograder/GradeResultsTable';

export const AutoGrader: React.FC = () => {
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [report, setReport] = useState<AutoGradeReport | null>(null);

  const runTests = () => {
    if (testCases.length === 0) return;
    const result = runAutoGrader(testCases);
    setReport(result);
    if (result.passedTests === result.totalTests) {
      toast.success('All tests passed! 🎉');
    } else {
      toast('Some tests failed.', { icon: '⚠️' });
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <TestUploader
        onTestCasesLoad={(cases) => {
          setTestCases(cases);
          setReport(null);
        }}
        onRunTests={runTests}
        testCasesCount={testCases.length}
      />

      {report && <GradeResultsTable report={report} testCases={testCases} />}
    </div>
  );
};
