import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TutorialModal } from '../../../components/playground/TutorialModal';
import { ThemeProvider } from '../../../context/ThemeContext';
import React from 'react';
import userEvent from '@testing-library/user-event';

const renderWithTheme = (ui: React.ReactNode) => {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
};

describe('TutorialModal Component', () => {
  const onClose = vi.fn();

  it('renders correctly when open', async () => {
    renderWithTheme(<TutorialModal isOpen={true} onClose={onClose} />);

    expect(await screen.findByText('tutorial.steps.welcome.title')).toBeInTheDocument();
    expect(await screen.findByText('tutorial.next')).toBeInTheDocument();
  });

  it('navigates through steps', async () => {
    const user = userEvent.setup();
    renderWithTheme(<TutorialModal isOpen={true} onClose={onClose} />);

    const nextBtn = await screen.findByText('tutorial.next');
    await user.click(nextBtn);

    expect(await screen.findByText('tutorial.steps.processes.title')).toBeInTheDocument();
    expect(await screen.findByText('tutorial.back')).toBeInTheDocument();
  });

  it('calls onClose when reaching the end', async () => {
    const user = userEvent.setup();
    renderWithTheme(<TutorialModal isOpen={true} onClose={onClose} />);

    // There are 7 steps
    for (let i = 0; i < 6; i++) {
      await user.click(await screen.findByText('tutorial.next'));
    }

    const finishBtn = await screen.findByText('tutorial.finish');
    await user.click(finishBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when clicking X', async () => {
    const user = userEvent.setup();
    renderWithTheme(<TutorialModal isOpen={true} onClose={onClose} />);

    const closeBtn = await screen.findByRole('button', { name: 'Close' });
    await user.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });
});
