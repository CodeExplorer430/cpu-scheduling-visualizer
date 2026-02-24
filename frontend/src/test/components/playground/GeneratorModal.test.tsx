import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GeneratorModal } from '../../../components/playground/GeneratorModal';

describe('GeneratorModal Component', () => {
  it('generates fair-share scenario with share fields', () => {
    const onGenerate = vi.fn();
    const onClose = vi.fn();

    render(<GeneratorModal isOpen={true} onClose={onClose} onGenerate={onGenerate} />);

    fireEvent.change(screen.getByDisplayValue('generator.types.random'), {
      target: { value: 'fair_share_groups' },
    });
    fireEvent.click(screen.getByText('generator.generate'));

    expect(onGenerate).toHaveBeenCalled();
    const generated = onGenerate.mock.calls[0][0];
    expect(generated.length).toBeGreaterThan(0);
    expect(generated[0]).toHaveProperty('shareGroup');
    expect(generated[0]).toHaveProperty('shareWeight');
  });

  it('generates real-time and lottery scenarios with required fields', () => {
    const onGenerate = vi.fn();
    const onClose = vi.fn();

    render(<GeneratorModal isOpen={true} onClose={onClose} onGenerate={onGenerate} />);

    const select = screen.getByDisplayValue('generator.types.random');

    fireEvent.change(select, { target: { value: 'lottery_weighted' } });
    fireEvent.click(screen.getByText('generator.generate'));
    let generated = onGenerate.mock.calls[0][0];
    expect(generated[0]).toHaveProperty('tickets');

    const select2 = screen.getByDisplayValue('generator.types.lottery_weighted');
    fireEvent.change(select2, { target: { value: 'edf_deadline_driven' } });
    fireEvent.click(screen.getByText('generator.generate'));
    generated = onGenerate.mock.calls[1][0];
    expect(generated[0]).toHaveProperty('deadline');
  });
});
