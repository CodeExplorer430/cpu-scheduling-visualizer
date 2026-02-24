import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ComparisonResults } from '../../../components/compare/ComparisonResults';
import { SimulationResult, Algorithm } from '@cpu-vis/shared';
import { ThemeProvider } from '../../../context/ThemeContext';
import React from 'react';

const mockHtml2Canvas = vi.fn().mockResolvedValue({ toDataURL: () => 'data:image/png;base64,' });
const mockJsPDFSave = vi.fn();
const mockJsPDFAddImage = vi.fn();
const mockJsPDF = vi.fn().mockImplementation(() => ({
  internal: { pageSize: { getWidth: () => 210 } },
  addImage: mockJsPDFAddImage,
  save: mockJsPDFSave,
}));

// Mock html2canvas and jspdf as they might not work well in jsdom
vi.mock('html2canvas', () => ({
  default: mockHtml2Canvas,
}));
vi.mock('jspdf', () => ({
  default: mockJsPDF,
}));

const renderWithTheme = (component: React.ReactNode) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('ComparisonResults Component', () => {
  let anchorClickSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    anchorClickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    mockHtml2Canvas.mockClear();
    mockJsPDF.mockClear();
    mockJsPDFAddImage.mockClear();
    mockJsPDFSave.mockClear();
  });

  afterEach(() => {
    anchorClickSpy.mockRestore();
  });

  const mockResults: Record<Algorithm, SimulationResult> = {
    FCFS: {
      events: [{ pid: 'P1', start: 0, end: 5, coreId: 0 }],
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
  } as unknown as Record<Algorithm, SimulationResult>;

  const algorithms: Algorithm[] = ['FCFS'];

  it('renders metrics comparison table', () => {
    renderWithTheme(<ComparisonResults results={mockResults} algorithms={algorithms} />);
    expect(screen.getByText('metrics.title')).toBeInTheDocument();
    expect(screen.getAllByText('controls.algorithms.FCFS').length).toBeGreaterThan(0);
  });

  it('renders Gantt charts for each algorithm', () => {
    const { container } = renderWithTheme(
      <ComparisonResults results={mockResults} algorithms={algorithms} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('triggers SVG download when clicking the export button', () => {
    // Mock XMLSerializer and URL
    const mockSerialize = vi.fn().mockReturnValue('<svg></svg>');
    global.XMLSerializer = vi.fn().mockImplementation(() => ({
      serializeToString: mockSerialize,
    }));
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:test');
    global.URL.revokeObjectURL = vi.fn();

    renderWithTheme(<ComparisonResults results={mockResults} algorithms={algorithms} />);

    // Find the button with the download icon title
    const downloadBtn = screen.getByTitle('controls.downloadSVG');
    fireEvent.click(downloadBtn);

    expect(mockSerialize).toHaveBeenCalled();
    expect(global.URL.createObjectURL).toHaveBeenCalled();
  });

  it('exports comparison as PNG', async () => {
    renderWithTheme(<ComparisonResults results={mockResults} algorithms={algorithms} />);

    fireEvent.click(screen.getByRole('button', { name: 'compare.export PNG' }));

    await waitFor(() => {
      expect(mockHtml2Canvas).toHaveBeenCalledTimes(1);
    });
    expect(anchorClickSpy).toHaveBeenCalled();
  });

  it('exports comparison as PDF', async () => {
    renderWithTheme(<ComparisonResults results={mockResults} algorithms={algorithms} />);

    fireEvent.click(screen.getByRole('button', { name: 'compare.export PDF' }));

    await waitFor(() => {
      expect(mockHtml2Canvas).toHaveBeenCalledTimes(1);
      expect(mockJsPDF).toHaveBeenCalledTimes(1);
    });
    expect(mockJsPDFAddImage).toHaveBeenCalled();
    expect(mockJsPDFSave).toHaveBeenCalledWith('quantix-comparison.pdf');
  });
});
