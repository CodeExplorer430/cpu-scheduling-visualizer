import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Compare } from '../../pages/Compare';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthProvider } from '../../context/AuthContext';
import { Process } from '@cpu-vis/shared';
import React from 'react';

const renderWithContexts = (component: React.ReactNode) => {
  return render(
    <ThemeProvider>
      <AuthProvider>{component}</AuthProvider>
    </ThemeProvider>
  );
};

describe('Compare Page', () => {
  it('renders without crashing', () => {
    const mockProcesses: Process[] = [{ pid: 'P1', arrival: 0, burst: 5 }];
    const mockOnProcessesChange = vi.fn();

    renderWithContexts(
      <Compare processes={mockProcesses} onProcessesChange={mockOnProcessesChange} />
    );

    // Check for ComparisonSettings title or content
    expect(screen.getByText('compare.runComparison')).toBeInTheDocument();

    // Check for ProcessTable
    expect(screen.getByText('processTable.pid')).toBeInTheDocument();
  });
});
