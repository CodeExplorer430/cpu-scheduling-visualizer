import React from 'react';
import { Process } from '@cpu-vis/shared';
import { ProcessTable } from '../components/ProcessTable';
import { Gantt } from '../components/GanttChart/Gantt';
import { Stepper } from '../components/Stepper';
import { SimulationControls } from '../components/playground/SimulationControls';
import { RealTimeStatus } from '../components/playground/RealTimeStatus';
import { SimulationMetrics } from '../components/playground/SimulationMetrics';
import { SimulationLogs } from '../components/playground/SimulationLogs';
import { StepExplainer } from '../components/playground/StepExplainer';
import { TutorialModal } from '../components/playground/TutorialModal';
import { useSimulation } from '../hooks/useSimulation';

interface Props {
  processes: Process[];
  onProcessesChange: (p: Process[]) => void;
}

export const Playground: React.FC<Props> = ({ processes, onProcessesChange }) => {
  const [isTutorialOpen, setIsTutorialOpen] = React.useState(false);

  const {
    selectedAlgorithm,
    setSelectedAlgorithm,
    quantum,
    setQuantum,
    contextSwitch,
    setContextSwitch,
    coreCount,
    setCoreCount,
    zoomLevel,
    setZoomLevel,
    energyConfig,
    setEnergyConfig,
    simulationResult,
    currentTime,
    setCurrentTime,
    isPlaying,
    setIsPlaying,
    runSimulation,
    optimizeQuantum,
  } = useSimulation(processes);

  const metrics = simulationResult?.metrics;
  const currentSnapshot = simulationResult?.snapshots?.find((s) => s.time === currentTime);
  const maxTime = simulationResult?.events.length
    ? simulationResult.events[simulationResult.events.length - 1].end
    : 0;

  return (
    <div className="space-y-8">
      {/* Inputs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-4 space-y-6">
          <SimulationControls
            selectedAlgorithm={selectedAlgorithm}
            setSelectedAlgorithm={setSelectedAlgorithm}
            quantum={quantum}
            setQuantum={setQuantum}
            contextSwitch={contextSwitch}
            setContextSwitch={setContextSwitch}
            coreCount={coreCount}
            setCoreCount={setCoreCount}
            zoomLevel={zoomLevel}
            setZoomLevel={setZoomLevel}
            energyConfig={energyConfig}
            setEnergyConfig={setEnergyConfig}
            onRun={runSimulation}
            onOptimizeQuantum={optimizeQuantum}
            onShowTutorial={() => setIsTutorialOpen(true)}
          />
        </div>

        <div className="lg:col-span-8">
          <ProcessTable processes={processes} onProcessChange={onProcessesChange} />
        </div>
      </div>

      <TutorialModal isOpen={isTutorialOpen} onClose={() => setIsTutorialOpen(false)} />

      {/* Outputs Section */}
      <div className="space-y-6">
        {/* Stepper */}
        {simulationResult && (
          <Stepper
            currentTime={currentTime}
            maxTime={maxTime}
            onTimeChange={setCurrentTime}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
          />
        )}

        {/* Real-time State */}
        {simulationResult && (
          <RealTimeStatus snapshot={currentSnapshot} currentTime={currentTime} maxTime={maxTime} />
        )}

        {/* Step Explainer - WHY things happened */}
        {simulationResult?.stepLogs && (
          <StepExplainer
            stepLogs={simulationResult.stepLogs}
            currentTime={currentTime}
            processes={processes}
          />
        )}

        {/* Gantt Chart */}
        {simulationResult ? (
          <Gantt events={simulationResult.events} currentTime={currentTime} />
        ) : (
          <div className="h-40 bg-white dark:bg-gray-800 rounded-lg shadow flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors duration-200">
            Run simulation to see Gantt Chart
          </div>
        )}

        {/* Metrics */}
        {metrics && <SimulationMetrics metrics={metrics} isFinished={currentTime >= maxTime} />}

        {/* Raw Logs */}
        {simulationResult?.logs && <SimulationLogs logs={simulationResult.logs} />}
      </div>
    </div>
  );
};
