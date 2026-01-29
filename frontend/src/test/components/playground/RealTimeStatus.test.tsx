import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RealTimeStatus } from '../../../components/playground/RealTimeStatus';

describe('RealTimeStatus Component', () => {
  it('should display IDLE when no snapshot and not finished', () => {
    render(<RealTimeStatus currentTime={0} maxTime={10} />);
    expect(screen.getByText('IDLE')).toBeInTheDocument();
  });

  it('should display FINISHED when no snapshot and time reached max', () => {
    render(<RealTimeStatus currentTime={10} maxTime={10} />);
    expect(screen.getByText('FINISHED')).toBeInTheDocument();
  });

  it('should display the running PID from snapshot', () => {
    const snapshot = { runningPid: 'P1', readyQueue: [], completedPids: [], ganttChart: [] };
    render(<RealTimeStatus snapshot={snapshot as any} currentTime={5} maxTime={10} />);
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  it('should display multiple running PIDs (multicore)', () => {
    const snapshot = { runningPid: ['P1', 'P2'], readyQueue: [], completedPids: [], ganttChart: [] };
    render(<RealTimeStatus snapshot={snapshot as any} currentTime={5} maxTime={10} />);
    expect(screen.getByText('P1')).toBeInTheDocument();
    expect(screen.getByText('P2')).toBeInTheDocument();
  });

  it('should display PIDs in the ready queue', () => {
    const snapshot = { runningPid: 'P1', readyQueue: ['P2', 'P3'], completedPids: [], ganttChart: [] };
    render(<RealTimeStatus snapshot={snapshot as any} currentTime={5} maxTime={10} />);
    expect(screen.getByText('P2')).toBeInTheDocument();
    expect(screen.getByText('P3')).toBeInTheDocument();
  });

  it('should show Empty when ready queue is empty', () => {
    const snapshot = { runningPid: 'P1', readyQueue: [], completedPids: [], ganttChart: [] };
    render(<RealTimeStatus snapshot={snapshot as any} currentTime={5} maxTime={10} />);
    expect(screen.getByText('Empty')).toBeInTheDocument();
  });
});
