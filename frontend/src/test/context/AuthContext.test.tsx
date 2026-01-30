import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock component to test AuthContext
const TestConsumer = () => {
  const { user, token, isAuthenticated } = useAuth();
  return (
    <div>
      <div data-testid="auth-status">{isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</div>
      <div data-testid="username">{user?.username || 'No User'}</div>
      <div data-testid="token">{token || 'No Token'}</div>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset URL
    window.history.pushState({}, '', '/');
  });

  it('provides unauthenticated state by default', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('Not Authenticated');
    expect(screen.getByTestId('username')).toHaveTextContent('No User');
  });

  it('processes token from URL parameters (OAuth redirect)', async () => {
    const mockUser = { username: 'OAuthUser', email: 'oauth@test.com' };
    const mockToken = 'fake-jwt-token';
    const userParam = encodeURIComponent(JSON.stringify(mockUser));
    
    // Simulate redirect from backend: /?token=...&user=...
    window.history.pushState({}, '', `/?token=${mockToken}&user=${userParam}`);

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('Authenticated');
      expect(screen.getByTestId('username')).toHaveTextContent('OAuthUser');
      expect(screen.getByTestId('token')).toHaveTextContent(mockToken);
    });

    // Check localStorage
    expect(localStorage.getItem('token')).toBe(mockToken);
    // URL should be cleaned
    expect(window.location.search).toBe('');
  });
});
