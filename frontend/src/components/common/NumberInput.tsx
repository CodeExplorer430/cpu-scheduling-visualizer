import React, { useState, useEffect, KeyboardEvent } from 'react';

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
  id?: string;
  name?: string;
  placeholder?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  className = '',
  min,
  max,
  step,
  id,
  name,
  placeholder,
}) => {
  // Local string state to allow empty values and formatting while typing
  const [localValue, setLocalValue] = useState<string>(value.toString());

  // Sync with parent value updates (e.g. from Randomize button),
  // but only when the parent value actually changes to something different
  // than what we currently parsed.
  useEffect(() => {
    // If the prop value matches our current local value (parsed), don't mess with the text.
    // This prevents cursor jumping or reformatting while the user is typing valid numbers.
    // However, if the prop changes externally (e.g. randomize), we must update.
    // We assume if the prop differs from our local parsed, it's an external change.
    const parsedLocal = parseFloat(localValue);
    if (parsedLocal !== value) {
      setLocalValue(value.toString());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  };

  const commit = () => {
    if (localValue === '') {
      // If empty, revert to the current valid prop value (or could be 0)
      setLocalValue(value.toString());
      return;
    }

    let parsed = parseFloat(localValue);

    if (isNaN(parsed)) {
      setLocalValue(value.toString());
      return;
    }

    // Clamp
    if (min !== undefined && parsed < min) parsed = min;
    if (max !== undefined && parsed > max) parsed = max;

    // Update parent
    onChange(parsed);
    
    // Update local value to the clean number string (removes leading zeros, etc.)
    setLocalValue(parsed.toString());
  };

  const handleBlur = () => {
    commit();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      commit();
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <input
      id={id}
      name={name}
      type="number"
      className={className}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      min={min}
      max={max}
      step={step}
      placeholder={placeholder}
      onFocus={(e) => e.target.select()} // Auto-select content on focus for quick replacement
    />
  );
};