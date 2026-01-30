import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProcessTable } from '../../components/ProcessTable';
import { Process } from '@cpu-vis/shared';
import { AuthProvider } from '../../context/AuthContext';
import React from 'react';

describe('ProcessTable Component', () => {
  const mockProcessChange = vi.fn();
  const initialProcesses: Process[] = [
    { pid: 'P1', arrival: 0, burst: 5 },
    { pid: 'P2', arrival: 2, burst: 3 },
  ];

  const renderWithAuth = (ui: React.ReactElement) => {
    return render(<AuthProvider>{ui}</AuthProvider>);
  };

  beforeEach(() => {
    mockProcessChange.mockClear();
  });

  it('renders correctly with initial processes', () => {
    renderWithAuth(
      <ProcessTable processes={initialProcesses} onProcessChange={mockProcessChange} />
    );

    expect(screen.getByDisplayValue('P1')).toBeInTheDocument();
    expect(screen.getByDisplayValue('P2')).toBeInTheDocument();
    expect(screen.getAllByDisplayValue('0')[0]).toBeInTheDocument(); // Arrival P1
    expect(screen.getAllByDisplayValue('5')[0]).toBeInTheDocument(); // Burst P1
  });

  it('calls onProcessChange when adding a process', () => {
    renderWithAuth(
      <ProcessTable processes={initialProcesses} onProcessChange={mockProcessChange} />
    );

    const addButton = screen.getByText('processTable.addProcess');
    fireEvent.click(addButton);

    expect(mockProcessChange).toHaveBeenCalledTimes(1);
    // Expect the new array to have 3 items
    const newProcesses = mockProcessChange.mock.calls[0][0];
    expect(newProcesses).toHaveLength(3);
  });

  it('calls onProcessChange when updating a process', () => {
    renderWithAuth(
      <ProcessTable processes={initialProcesses} onProcessChange={mockProcessChange} />
    );

    // Burst inputs are the second number inputs in each row
    // P1 is first row.
    const p1BurstInput = screen.getAllByDisplayValue('5')[0];

    // Change value
    fireEvent.change(p1BurstInput, { target: { value: '10' } });
    // Trigger blur to commit the change (NumberInput behavior)
    fireEvent.blur(p1BurstInput);

    expect(mockProcessChange).toHaveBeenCalled();
    const updatedProcesses = mockProcessChange.mock.calls[0][0];
    expect(updatedProcesses[0].burst).toBe(10);
  });

  it('calls onProcessChange when removing a process', () => {
    renderWithAuth(
      <ProcessTable processes={initialProcesses} onProcessChange={mockProcessChange} />
    );

    const deleteButtons = screen.getAllByText('processTable.delete');
    fireEvent.click(deleteButtons[0]); // Delete P1

    expect(mockProcessChange).toHaveBeenCalled();
    const updatedProcesses =
      mockProcessChange.mock.calls[mockProcessChange.mock.calls.length - 1][0];
    expect(updatedProcesses).toHaveLength(1);
    expect(updatedProcesses[0].pid).toBe('P2');
  });
});
