import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimulationLogs } from '../../../components/playground/SimulationLogs';

describe('SimulationLogs Component', () => {
  it('should not render anything when logs are empty', () => {
    const { container } = render(<SimulationLogs logs={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render logs when provided', () => {
    const logs = ['Process P1 started', 'Process P1 finished'];
    render(<SimulationLogs logs={logs} />);
    
    expect(screen.getByText('Execution Log')).toBeInTheDocument();
    expect(screen.getByText('Process P1 started')).toBeInTheDocument();
    expect(screen.getByText('Process P1 finished')).toBeInTheDocument();
  });

  it('should show log indices', () => {
    const logs = ['Log message'];
    render(<SimulationLogs logs={logs} />);
    expect(screen.getByText('[1]')).toBeInTheDocument();
  });
});
