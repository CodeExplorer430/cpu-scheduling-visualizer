import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ProfileSettings } from '../../../components/dashboard/ProfileSettings';
import { AuthContext } from '../../../context/AuthContext';
import { ThemeProvider } from '../../../context/ThemeContext';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

const mockUser = {
  id: '1',
  username: 'testuser',
  email: 'test@example.com',
  profile: { bio: 'Hello' },
};

const mockUpdateUser = vi.fn();

const renderWithContext = (component: React.ReactNode) => {
  return render(
    <ThemeProvider>
      <AuthContext.Provider
        value={{
          user: mockUser,
          token: 'token',
          isAuthenticated: true,
          login: vi.fn(),
          logout: vi.fn(),
          updateUser: mockUpdateUser,
          isLoading: false,
        }}
      >
        {component}
      </AuthContext.Provider>
    </ThemeProvider>
  );
};

describe('ProfileSettings', () => {
  it('renders profile inputs with correct padding class', () => {
    renderWithContext(<ProfileSettings mode="profile" />);

    const usernameInput = screen.getByDisplayValue('testuser');
    const bioInput = screen.getByDisplayValue('Hello');

    // Check for the specific padding fix we added
    expect(usernameInput).toHaveClass('p-2');
    expect(bioInput).toHaveClass('p-2');
  });

  it('updates profile on submit', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockUser, username: 'newname' }),
    });

    renderWithContext(<ProfileSettings mode="profile" />);

    const usernameInput = screen.getByDisplayValue('testuser');
    fireEvent.change(usernameInput, { target: { value: 'newname' } });

    const submitBtn = screen.getByText('common.saveChanges'); // Translation key
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/user/profile',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ username: 'newname', bio: 'Hello' }),
        })
      );
    });
  });
});
