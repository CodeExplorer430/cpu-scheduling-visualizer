import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimulationControls } from '../../../components/playground/SimulationControls';

describe('SimulationControls Component', () => {
  const mockSetAlgo = vi.fn();
  const mockSetQuantum = vi.fn();
  const mockSetContextSwitch = vi.fn();
  const mockSetCoreCount = vi.fn();
  const mockSetZoomLevel = vi.fn();
  const mockSetEnergyConfig = vi.fn();
  const mockOnRun = vi.fn();
  const mockOnShowTutorial = vi.fn();

  const energyConfig = { activeWatts: 20, idleWatts: 5, switchJoules: 0.1 };

  it('renders correctly', () => {
    render(
      <SimulationControls
        selectedAlgorithm="FCFS"
        setSelectedAlgorithm={mockSetAlgo}
        quantum={2}
        setQuantum={mockSetQuantum}
        contextSwitch={0}
        setContextSwitch={mockSetContextSwitch}
        coreCount={1}
        setCoreCount={mockSetCoreCount}
        zoomLevel={1}
        setZoomLevel={mockSetZoomLevel}
        energyConfig={energyConfig}
        setEnergyConfig={mockSetEnergyConfig}
        onRun={mockOnRun}
        onShowTutorial={mockOnShowTutorial}
      />
    );

    expect(screen.getByLabelText('controls.algorithm')).toBeInTheDocument();
    expect(screen.getByText('common.run')).toBeInTheDocument();
  });

  it('shows quantum input only when RR is selected', () => {
    const { rerender } = render(
      <SimulationControls
        selectedAlgorithm="FCFS"
        setSelectedAlgorithm={mockSetAlgo}
        quantum={2}
        setQuantum={mockSetQuantum}
        contextSwitch={0}
        setContextSwitch={mockSetContextSwitch}
        coreCount={1}
        setCoreCount={mockSetCoreCount}
        zoomLevel={1}
        setZoomLevel={mockSetZoomLevel}
        energyConfig={energyConfig}
        setEnergyConfig={mockSetEnergyConfig}
        onRun={mockOnRun}
        onShowTutorial={mockOnShowTutorial}
      />
    );

    expect(screen.queryByLabelText('controls.quantum')).not.toBeInTheDocument();

    rerender(
      <SimulationControls
        selectedAlgorithm="RR"
        setSelectedAlgorithm={mockSetAlgo}
        quantum={2}
        setQuantum={mockSetQuantum}
        contextSwitch={0}
        setContextSwitch={mockSetContextSwitch}
        coreCount={1}
        setCoreCount={mockSetCoreCount}
        zoomLevel={1}
        setZoomLevel={mockSetZoomLevel}
        energyConfig={energyConfig}
        setEnergyConfig={mockSetEnergyConfig}
        onRun={mockOnRun}
        onShowTutorial={mockOnShowTutorial}
      />
    );

    expect(screen.getByLabelText('controls.quantum')).toBeInTheDocument();
  });

  it('calls onRun when clicking button', () => {
    render(
      <SimulationControls
        selectedAlgorithm="FCFS"
        setSelectedAlgorithm={mockSetAlgo}
        quantum={2}
        setQuantum={mockSetQuantum}
        contextSwitch={0}
        setContextSwitch={mockSetContextSwitch}
        coreCount={1}
        setCoreCount={mockSetCoreCount}
        zoomLevel={1}
        setZoomLevel={mockSetZoomLevel}
        energyConfig={energyConfig}
        setEnergyConfig={mockSetEnergyConfig}
        onRun={mockOnRun}
        onShowTutorial={mockOnShowTutorial}
      />
    );

    fireEvent.click(screen.getByText('common.run'));
    expect(mockOnRun).toHaveBeenCalled();
  });
});
