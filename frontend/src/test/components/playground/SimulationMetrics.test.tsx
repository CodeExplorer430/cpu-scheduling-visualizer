import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimulationMetrics } from '../../../components/playground/SimulationMetrics';
import { Metrics } from '@cpu-vis/shared';

describe('SimulationMetrics Component', () => {
  const mockMetrics: Metrics = {
    completion: { P1: 5 },
    turnaround: { P1: 5 },
    waiting: { P1: 2 },
    response: { P1: 1 },
    avgTurnaround: 5,
    avgWaiting: 2,
    avgResponse: 1,
    p95Turnaround: 5,
    p95Waiting: 2,
    p95Response: 1,
    stdDevTurnaround: 0,
    stdDevWaiting: 0,
    stdDevResponse: 0,
    contextSwitches: 0,
  };

  it('renders metrics correctly', () => {
    render(<SimulationMetrics metrics={mockMetrics} isFinished={true} />);

    expect(screen.getByText('5.00')).toBeInTheDocument(); // Avg Turnaround
    expect(screen.getByText('2.00')).toBeInTheDocument(); // Avg Waiting
    expect(screen.getByText('1.00')).toBeInTheDocument(); // Avg Response
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  it('shows progress label if not finished', () => {
    render(<SimulationMetrics metrics={mockMetrics} isFinished={false} />);
    expect(screen.getByText('Simulation in progress...')).toBeInTheDocument();
  });
});
