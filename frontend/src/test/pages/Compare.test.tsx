import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Compare } from '../../pages/Compare';
import { ThemeProvider } from '../../context/ThemeContext';
import { AuthContext } from '../../context/AuthContext';
import { MemoryRouter } from 'react-router-dom';

const mockProcesses = [{ pid: 'P1', arrival: 0, burst: 5, priority: 1 }];

const mockSetProcesses = vi.fn();

const renderWithProviders = (ui: React.ReactNode) => {
  return render(
    <MemoryRouter>
      <ThemeProvider>
        <AuthContext.Provider
          value={{
            user: null,
            token: null,
            isAuthenticated: false,
            login: vi.fn(),
            logout: vi.fn(),
            updateUser: vi.fn(),
            isLoading: false,
          }}
        >
          {ui}
        </AuthContext.Provider>
      </ThemeProvider>
    </MemoryRouter>
  );
};

describe('Compare Page', () => {
  it('renders title and process table', () => {
    renderWithProviders(<Compare processes={mockProcesses} onProcessesChange={mockSetProcesses} />);

    expect(screen.getByText('nav.compare')).toBeInTheDocument();
    expect(screen.getByText('P1')).toBeInTheDocument();
  });

  // Note: Export functionality (PNG/PDF) relies on html2canvas and DOM layout
  // which is difficult to fully mock in JSDOM.
  // Verified manually:
  // 1. Desktop export works.
  // 2. Mobile export forces 1280px width to capture full chart.
});
