import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSimulation } from '../../hooks/useSimulation';
import * as shared from '@cpu-vis/shared';
import * as optimizer from '../../lib/optimizer';

// Mock dependencies
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../../lib/optimizer', () => ({
  findOptimalQuantum: vi.fn(),
}));

vi.mock('@cpu-vis/shared', () => ({
  runFCFS: vi.fn(),
  runRR: vi.fn(),
  runSJF: vi.fn(),
  runLJF: vi.fn(),
  runSRTF: vi.fn(),
  runLRTF: vi.fn(),
  runPriority: vi.fn(),
  runPriorityPreemptive: vi.fn(),
  runMQ: vi.fn(),
  runMLFQ: vi.fn(),
  runHRRN: vi.fn(),
}));

describe('useSimulation Hook', () => {
  const mockProcesses = [{ id: 1, arrivalTime: 0, burstTime: 5, priority: 1, color: '#fff' }];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSimulation(mockProcesses));

    expect(result.current.selectedAlgorithm).toBe('FCFS');
    expect(result.current.quantum).toBe(2);
    expect(result.current.simulationResult).toBeNull();
  });

  it('should update algorithm selection', () => {
    const { result } = renderHook(() => useSimulation(mockProcesses));

    act(() => {
      result.current.setSelectedAlgorithm('RR');
    });

    expect(result.current.selectedAlgorithm).toBe('RR');
  });

  it('should run simulation and update result', () => {
    const { result } = renderHook(() => useSimulation(mockProcesses));
    const mockResult = { events: [], stats: {} };
    vi.mocked(shared.runFCFS).mockReturnValue(mockResult as any);

    act(() => {
      result.current.runSimulation();
    });

    expect(shared.runFCFS).toHaveBeenCalledWith(mockProcesses, expect.objectContaining({
        quantum: 2,
        coreCount: 1
    }));
    expect(result.current.simulationResult).toBe(mockResult);
  });

  it('should run correct algorithm when changed', () => {
    const { result } = renderHook(() => useSimulation(mockProcesses));
    const mockResult = { events: [], stats: {} };
    vi.mocked(shared.runRR).mockReturnValue(mockResult as any);

    act(() => {
      result.current.setSelectedAlgorithm('RR');
    });
    
    act(() => {
        result.current.runSimulation();
    });

    expect(shared.runRR).toHaveBeenCalled();
    expect(result.current.simulationResult).toBe(mockResult);
  });

  it('should optimize quantum', () => {
    const { result } = renderHook(() => useSimulation(mockProcesses));
    vi.mocked(optimizer.findOptimalQuantum).mockReturnValue({
        optimalQuantum: 5,
        minAvgWaiting: 2.5,
        results: []
    });

    act(() => {
      result.current.optimizeQuantum();
    });

    expect(result.current.quantum).toBe(5);
  });
});
