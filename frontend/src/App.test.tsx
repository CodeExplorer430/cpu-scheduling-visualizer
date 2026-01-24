import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import App from './App';

describe('App Component', () => {
  it('renders without crashing', () => {
    render(<App />);
    expect(document.body).toBeDefined();
  });
});
