import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Playground } from '../../pages/Playground';
import { ThemeProvider } from '../../context/ThemeContext';
import { Process } from '@cpu-vis/shared';
import React from 'react';

const renderWithTheme = (component: React.ReactNode) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Playground Page', () => {
  it('renders without crashing', () => {
    const mockProcesses: Process[] = [{ pid: 'P1', arrival: 0, burst: 5 }];
    const mockOnProcessChange = vi.fn();

    renderWithTheme(
      <Playground processes={mockProcesses} onProcessesChange={mockOnProcessChange} />
    );

    // Check for main heading (SimulationControls usually has the title or similar, or just check known text)
    // Actually looking at Playground.tsx, it uses SimulationControls.
    // Let's check for texts we know exist in the child components or the page structure.

    // SimulationControls has 'Algorithm' label
    expect(screen.getByText('Algorithm')).toBeInTheDocument();

    // ProcessTable has headers
    expect(screen.getByText('PID')).toBeInTheDocument();
    expect(screen.getByText('Burst')).toBeInTheDocument();
  });
});
