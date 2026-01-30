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

  // Sync with parent value updates (e.g. from Randomize button)
  useEffect(() => {
    const parsedLocal = parseFloat(localValue);
    // If prop differs from our local state (parsed), or if local is empty/invalid but prop is valid, sync.
    // This allows external resets to fix empty fields.
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
      // Allow empty state (don't revert to old value immediately)
      // This lets the user clear the field and see the placeholder
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
