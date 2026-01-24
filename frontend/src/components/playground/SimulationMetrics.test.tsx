import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimulationMetrics } from './SimulationMetrics';
import { Metrics } from '@cpu-vis/shared';
import React from 'react';

describe('SimulationMetrics Component', () => {
  const mockMetrics: Metrics = {
    completion: { P1: 5 },
    turnaround: { P1: 5 },
    waiting: { P1: 0 },
    avgTurnaround: 5,
    avgWaiting: 0,
    contextSwitches: 0,
  };

  it('renders metrics correctly', () => {
    render(<SimulationMetrics metrics={mockMetrics} isFinished={true} />);

    expect(screen.getByText('5.00')).toBeInTheDocument(); // Avg Turnaround
    expect(screen.getByText('0.00')).toBeInTheDocument(); // Avg Waiting
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  it('shows progress label if not finished', () => {
    render(<SimulationMetrics metrics={mockMetrics} isFinished={false} />);
    expect(screen.getByText('Simulation in progress...')).toBeInTheDocument();
  });
});
