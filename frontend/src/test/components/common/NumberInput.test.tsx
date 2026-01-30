import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NumberInput } from '../../../components/common/NumberInput';

describe('NumberInput Component', () => {
  it('renders with initial value', () => {
    render(<NumberInput value={10} onChange={() => {}} />);
    expect(screen.getByRole('spinbutton')).toHaveValue(10);
  });

  it('updates local value on change without calling onChange immediately', () => {
    const handleChange = vi.fn();
    render(<NumberInput value={10} onChange={handleChange} />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '100' } });
    
    // Value in DOM should update
    expect(input).toHaveValue(100);
    // Parent onChange should NOT be called yet (commit on blur)
    expect(handleChange).not.toHaveBeenCalled();
  });

  it('calls onChange and formats on blur', () => {
    const handleChange = vi.fn();
    render(<NumberInput value={10} onChange={handleChange} />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '05' } });
    fireEvent.blur(input);
    
    expect(handleChange).toHaveBeenCalledWith(5);
    expect(input).toHaveValue(5); // Formatted "05" -> 5
  });

  it('allows empty string while typing, reverts on blur', () => {
    const handleChange = vi.fn();
    render(<NumberInput value={10} onChange={handleChange} />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '' } });
    expect(input).toHaveValue(null); // Empty
    
    fireEvent.blur(input);
    expect(input).toHaveValue(10); // Reverted
    expect(handleChange).not.toHaveBeenCalled(); // No change to parent
  });

  it('clamps min value on blur', () => {
    const handleChange = vi.fn();
    render(<NumberInput value={10} min={5} onChange={handleChange} />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '2' } });
    fireEvent.blur(input);
    
    expect(handleChange).toHaveBeenCalledWith(5);
    expect(input).toHaveValue(5);
  });

  it('clamps max value on blur', () => {
    const handleChange = vi.fn();
    render(<NumberInput value={10} max={20} onChange={handleChange} />);
    
    const input = screen.getByRole('spinbutton');
    fireEvent.change(input, { target: { value: '25' } });
    fireEvent.blur(input);
    
    expect(handleChange).toHaveBeenCalledWith(20);
    expect(input).toHaveValue(20);
  });

  it('updates when prop changes externally', () => {
    const { rerender } = render(<NumberInput value={10} onChange={() => {}} />);
    const input = screen.getByRole('spinbutton');
    expect(input).toHaveValue(10);

    rerender(<NumberInput value={50} onChange={() => {}} />);
    expect(input).toHaveValue(50);
  });
});
