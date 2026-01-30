import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { OAuthButtons } from '../../components/auth/OAuthButtons';
import { BrowserRouter } from 'react-router-dom';

describe('OAuthButtons', () => {
  it('renders all 5 OAuth buttons', () => {
    render(
      <BrowserRouter>
        <OAuthButtons />
      </BrowserRouter>
    );

    const buttons = ['Google', 'GitHub', 'GitLab', 'Discord', 'LinkedIn'];
    buttons.forEach((provider) => {
      expect(screen.getByText(new RegExp(provider, 'i'))).toBeDefined();
    });
  });

  it('contains correct href links', () => {
    render(
      <BrowserRouter>
        <OAuthButtons />
      </BrowserRouter>
    );

    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href') || '');

    expect(hrefs.some((h) => h.endsWith('/api/auth/google'))).toBe(true);
    expect(hrefs.some((h) => h.endsWith('/api/auth/github'))).toBe(true);
    expect(hrefs.some((h) => h.endsWith('/api/auth/gitlab'))).toBe(true);
    expect(hrefs.some((h) => h.endsWith('/api/auth/discord'))).toBe(true);
    expect(hrefs.some((h) => h.endsWith('/api/auth/linkedin'))).toBe(true);
  });
});
