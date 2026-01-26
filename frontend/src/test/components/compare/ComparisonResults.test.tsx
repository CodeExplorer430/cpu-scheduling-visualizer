import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ComparisonResults } from '../../../components/compare/ComparisonResults';
import { SimulationResult, Algorithm } from '@cpu-vis/shared';
import { ThemeProvider } from '../../../context/ThemeContext';
import React from 'react';

// Mock html2canvas and jspdf as they might not work well in jsdom
vi.mock('html2canvas', () => ({
  default: vi.fn().mockResolvedValue({ toDataURL: () => 'data:image/png;base64,' }),
}));
vi.mock('jspdf', () => ({
  default: vi.fn().mockImplementation(() => ({
    internal: { pageSize: { getWidth: () => 210 } },
    addImage: vi.fn(),
    save: vi.fn(),
  })),
}));

const renderWithTheme = (component: React.ReactNode) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('ComparisonResults Component', () => {
  const mockResults: Record<Algorithm, SimulationResult> = {
    FCFS: {
      events: [{ pid: 'P1', start: 0, end: 5 }],
      metrics: {
        completion: { P1: 5 },
        turnaround: { P1: 5 },
        waiting: { P1: 0 },
        avgTurnaround: 5,
        avgWaiting: 0,
        contextSwitches: 0,
      },
      snapshots: [],
    },
    // Add placeholders for others if needed, but let's just test with a subset
  } as unknown as Record<Algorithm, SimulationResult>;

  const algorithms: Algorithm[] = ['FCFS'];

  it('renders metrics comparison table', () => {
    renderWithTheme(<ComparisonResults results={mockResults} algorithms={algorithms} />);
    expect(screen.getByText('metrics.title')).toBeInTheDocument();
    // Use getAllByText as FCFS appears in table and chart headings
    expect(screen.getAllByText('controls.algorithms.FCFS').length).toBeGreaterThan(0);
  });

  it('renders Gantt charts for each algorithm', () => {
    const { container } = renderWithTheme(
      <ComparisonResults results={mockResults} algorithms={algorithms} />
    );
    // Gantt component renders an svg
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
