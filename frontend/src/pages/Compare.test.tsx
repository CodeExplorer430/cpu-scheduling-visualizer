import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Compare } from './Compare';
import { ThemeProvider } from '../context/ThemeContext';
import { Process } from '@cpu-vis/shared';
import React from 'react';

const renderWithTheme = (component: React.ReactNode) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Compare Page', () => {
  it('renders without crashing', () => {
    const mockProcesses: Process[] = [{ pid: 'P1', arrival: 0, burst: 5 }];
    const mockOnProcessesChange = vi.fn();

    renderWithTheme(<Compare processes={mockProcesses} onProcessesChange={mockOnProcessesChange} />);

    // Check for ComparisonSettings title or content
    expect(screen.getByText('Run Comparison')).toBeInTheDocument();

    // Check for ProcessTable
    expect(screen.getByText('PID')).toBeInTheDocument();
  });
});
