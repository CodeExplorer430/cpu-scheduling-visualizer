import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TutorialModal } from '../../../components/playground/TutorialModal';
import { ThemeProvider } from '../../../context/ThemeContext';
import React from 'react';

const renderWithTheme = (ui: React.ReactNode) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe('TutorialModal Component', () => {
  const onClose = vi.fn();

  it('renders correctly when open', () => {
    renderWithTheme(<TutorialModal isOpen={true} onClose={onClose} />);

    // Check for title of first step
    expect(screen.getByText('tutorial.steps.welcome.title')).toBeInTheDocument();
    expect(screen.getByText('tutorial.next')).toBeInTheDocument();
  });

  it('navigates through steps', () => {
    renderWithTheme(<TutorialModal isOpen={true} onClose={onClose} />);

    const nextBtn = screen.getByText('tutorial.next');
    fireEvent.click(nextBtn);

    expect(screen.getByText('tutorial.steps.processes.title')).toBeInTheDocument();
    expect(screen.getByText('tutorial.back')).toBeInTheDocument();
  });

  it('calls onClose when reaching the end', () => {
    renderWithTheme(<TutorialModal isOpen={true} onClose={onClose} />);

    // There are 7 steps
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByText('tutorial.next'));
    }

    const finishBtn = screen.getByText('tutorial.finish');
    fireEvent.click(finishBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking X', () => {
    renderWithTheme(<TutorialModal isOpen={true} onClose={onClose} />);

    const closeBtn = screen.getByRole('button', { name: 'Close' });
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
