import React, { useState, useEffect } from 'react';
import { MinusIcon, PlusIcon } from '@heroicons/react/24/outline';

interface NumberInputProps {
  id: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export const NumberInput: React.FC<NumberInputProps> = ({
  id,
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  className = '',
}) => {
  // Local state to allow empty/partial input while typing
  const [inputValue, setInputValue] = useState(value.toString());

  // Sync local state when prop changes externally
  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    setInputValue(newVal);

    const parsed = parseFloat(newVal);
    if (!isNaN(parsed)) {
      // Only update parent if it's a valid number
      // We don't enforce min/max strictly while typing to allow intermediate states
      // (e.g. typing "10" when min is 5: "1" might be invalid temporarily)
      onChange(parsed);
    }
  };

  const handleBlur = () => {
    let parsed = parseFloat(inputValue);
    
    // If empty or invalid, revert to last valid prop value
    if (isNaN(parsed)) {
      setInputValue(value.toString());
      return;
    }

    // Clamp on blur
    if (min !== undefined && parsed < min) parsed = min;
    if (max !== undefined && parsed > max) parsed = max;

    setInputValue(parsed.toString());
    onChange(parsed);
  };

  const increment = () => {
    let newVal = value + step;
    if (max !== undefined && newVal > max) newVal = max;
    // Fix floating point precision
    newVal = Math.round(newVal * 100) / 100;
    onChange(newVal);
    setInputValue(newVal.toString());
  };

  const decrement = () => {
    let newVal = value - step;
    if (min !== undefined && newVal < min) newVal = min;
    // Fix floating point precision
    newVal = Math.round(newVal * 100) / 100;
    onChange(newVal);
    setInputValue(newVal.toString());
  };

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
      >
        {label}
      </label>
      <div className="flex rounded-md shadow-sm">
        <button
          type="button"
          onClick={decrement}
          className="relative inline-flex items-center px-3 py-2 rounded-l-md border border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 sm:text-sm focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <MinusIcon className="h-4 w-4" aria-hidden="true" />
        </button>
        <input
          type="number"
          name={id}
          id={id}
          className="focus:ring-blue-500 focus:border-blue-500 block w-full text-center sm:text-sm border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-none border-x-0 appearance-none"
          placeholder={value.toString()}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={(e) => e.target.select()} // Auto-select on focus for easy replacement
          step={step}
        />
        <button
          type="button"
          onClick={increment}
          className="relative inline-flex items-center px-3 py-2 rounded-r-md border border-gray-300 bg-gray-50 text-gray-500 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 sm:text-sm focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        >
          <PlusIcon className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};
