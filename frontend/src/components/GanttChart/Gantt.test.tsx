import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Gantt } from './Gantt';
import { GanttEvent } from '@cpu-vis/shared';
import { ThemeProvider } from '../../context/ThemeContext';
import React from 'react';

// Wrap in ThemeProvider because Gantt uses useTheme
const renderWithTheme = (component: React.ReactNode) => {
  return render(<ThemeProvider>{component}</ThemeProvider>);
};

describe('Gantt Component', () => {
  const events: GanttEvent[] = [
    { pid: 'P1', start: 0, end: 5 },
    { pid: 'P2', start: 5, end: 8 },
    { pid: 'IDLE', start: 8, end: 10 },
  ];

  it('renders SVG and bars', () => {
    const { container } = renderWithTheme(<Gantt events={events} />);

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();

    // D3 renders rects for bars
    const bars = container.querySelectorAll('.bar');
    expect(bars).toHaveLength(3);
  });

  it('renders labels correctly', () => {
    const { container } = renderWithTheme(<Gantt events={events} />);
    // Only P1 and P2 should have text labels, IDLE usually empty or specific color
    // Based on code: .text(d => d.pid === 'IDLE' ? '' : d.pid)

    const texts = container.querySelectorAll('text');
    // There are axis labels too, so we need to be specific or just check if P1 exists
    const p1Label = Array.from(texts).find((t) => t.textContent === 'P1');
    expect(p1Label).toBeInTheDocument();

    const idleLabel = Array.from(texts).find((t) => t.textContent === 'IDLE');
    // Should verify IDLE text is NOT there or empty
    expect(idleLabel).toBeUndefined();
  });
});
