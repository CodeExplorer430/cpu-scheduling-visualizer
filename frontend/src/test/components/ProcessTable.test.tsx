import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessTable } from '../../components/ProcessTable';
import { Process } from '@cpu-vis/shared';

// Mock matchMedia if not already globally mocked, but setup.ts should handle it.

describe('ProcessTable Component', () => {
  const mockProcessChange = vi.fn();
  const initialProcesses: Process[] = [
    { pid: 'P1', arrival: 0, burst: 5 },
    { pid: 'P2', arrival: 2, burst: 3 },
  ];

  beforeEach(() => {
    mockProcessChange.mockClear();
  });

  it('renders correctly with initial processes', () => {
    render(<ProcessTable processes={initialProcesses} onProcessChange={mockProcessChange} />);

    expect(screen.getByDisplayValue('P1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('P2')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('0')[0]).toBeInTheDocument(); // Arrival P1
    expect(screen.getAllByDisplayValue('5')[0]).toBeInTheDocument(); // Burst P1
  });

  it('calls onProcessChange when adding a process', () => {
    render(<ProcessTable processes={initialProcesses} onProcessChange={mockProcessChange} />);

    const addButton = screen.getByText('+ Add');
    fireEvent.click(addButton);

    expect(mockProcessChange).toHaveBeenCalledTimes(1);
    // Expect the new array to have 3 items
    const newProcesses = mockProcessChange.mock.calls[0][0];
    expect(newProcesses).toHaveLength(3);
  });

  it('calls onProcessChange when updating a process', () => {
    render(<ProcessTable processes={initialProcesses} onProcessChange={mockProcessChange} />);

    const p1BurstInput = screen.getAllByDisplayValue('5')[0];
    fireEvent.change(p1BurstInput, { target: { value: '10' } });

    expect(mockProcessChange).toHaveBeenCalled();
    const updatedProcesses = mockProcessChange.mock.calls[0][0]; // Check last call arguments? No, calls[0] if it's the first call.
    // Actually we should clear mock before test or use mockProcessChange.mock.lastCall
    expect(updatedProcesses[0].burst).toBe(10);
  });

  it('calls onProcessChange when removing a process', () => {
    render(<ProcessTable processes={initialProcesses} onProcessChange={mockProcessChange} />);

    const deleteButtons = screen.getAllByText('Delete');
    fireEvent.click(deleteButtons[0]); // Delete P1

    expect(mockProcessChange).toHaveBeenCalled();
    const updatedProcesses =
      mockProcessChange.mock.calls[mockProcessChange.mock.calls.length - 1][0];
    expect(updatedProcesses).toHaveLength(1);
    expect(updatedProcesses[0].pid).toBe('P2');
  });
});
