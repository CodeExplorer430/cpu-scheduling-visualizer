import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { GeneratorModal } from '../../../components/playground/GeneratorModal';
import userEvent from '@testing-library/user-event';

describe('GeneratorModal Component', () => {
  it('generates fair-share scenario with share fields', async () => {
    const onGenerate = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<GeneratorModal isOpen={true} onClose={onClose} onGenerate={onGenerate} />);

    const select = await screen.findByDisplayValue('generator.types.random');
    await user.selectOptions(select, 'fair_share_groups');
    await user.click(await screen.findByText('generator.generate'));

    expect(onGenerate).toHaveBeenCalled();
    const generated = onGenerate.mock.calls[0][0];
    expect(generated.length).toBeGreaterThan(0);
    expect(generated[0]).toHaveProperty('shareGroup');
    expect(generated[0]).toHaveProperty('shareWeight');
  });

  it('generates real-time and lottery scenarios with required fields', async () => {
    const onGenerate = vi.fn();
    const onClose = vi.fn();
    const user = userEvent.setup();

    render(<GeneratorModal isOpen={true} onClose={onClose} onGenerate={onGenerate} />);

    const select = await screen.findByDisplayValue('generator.types.random');

    await user.selectOptions(select, 'lottery_weighted');
    await user.click(await screen.findByText('generator.generate'));
    let generated = onGenerate.mock.calls[0][0];
    expect(generated[0]).toHaveProperty('tickets');

    const select2 = await screen.findByDisplayValue('generator.types.lottery_weighted');
    await user.selectOptions(select2, 'edf_deadline_driven');
    await user.click(await screen.findByText('generator.generate'));
    generated = onGenerate.mock.calls[1][0];
    expect(generated[0]).toHaveProperty('deadline');
  });
});
