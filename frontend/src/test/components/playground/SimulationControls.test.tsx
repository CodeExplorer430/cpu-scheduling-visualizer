import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimulationControls } from '../../../components/playground/SimulationControls';

describe('SimulationControls Component', () => {
  const mockSetAlgo = vi.fn();
  const mockSetQuantum = vi.fn();
  const mockSetRandomSeed = vi.fn();
  const mockSetFairShareQuantum = vi.fn();
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
        randomSeed={42}
        setRandomSeed={mockSetRandomSeed}
        fairShareQuantum={1}
        setFairShareQuantum={mockSetFairShareQuantum}
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
        randomSeed={42}
        setRandomSeed={mockSetRandomSeed}
        fairShareQuantum={1}
        setFairShareQuantum={mockSetFairShareQuantum}
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
        randomSeed={42}
        setRandomSeed={mockSetRandomSeed}
        fairShareQuantum={1}
        setFairShareQuantum={mockSetFairShareQuantum}
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
        randomSeed={42}
        setRandomSeed={mockSetRandomSeed}
        fairShareQuantum={1}
        setFairShareQuantum={mockSetFairShareQuantum}
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

  it('shows algorithm-specific advanced controls', () => {
    const { rerender } = render(
      <SimulationControls
        selectedAlgorithm="LOTTERY"
        setSelectedAlgorithm={mockSetAlgo}
        quantum={2}
        setQuantum={mockSetQuantum}
        randomSeed={42}
        setRandomSeed={mockSetRandomSeed}
        fairShareQuantum={1}
        setFairShareQuantum={mockSetFairShareQuantum}
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

    expect(screen.getByLabelText('controls.randomSeed')).toBeInTheDocument();

    rerender(
      <SimulationControls
        selectedAlgorithm="FAIR_SHARE"
        setSelectedAlgorithm={mockSetAlgo}
        quantum={2}
        setQuantum={mockSetQuantum}
        randomSeed={42}
        setRandomSeed={mockSetRandomSeed}
        fairShareQuantum={1}
        setFairShareQuantum={mockSetFairShareQuantum}
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

    expect(screen.getByLabelText('controls.fairShareQuantum')).toBeInTheDocument();
  });

  it('commits core count on change so run uses latest value', () => {
    render(
      <SimulationControls
        selectedAlgorithm="FCFS"
        setSelectedAlgorithm={mockSetAlgo}
        quantum={2}
        setQuantum={mockSetQuantum}
        randomSeed={42}
        setRandomSeed={mockSetRandomSeed}
        fairShareQuantum={1}
        setFairShareQuantum={mockSetFairShareQuantum}
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

    fireEvent.change(screen.getByLabelText('controls.cores'), { target: { value: '4' } });
    expect(mockSetCoreCount).toHaveBeenCalledWith(4);
  });
});
