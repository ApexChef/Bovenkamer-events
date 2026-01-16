'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';

interface SelectOption {
  value: string;
  label: string;
  description?: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: readonly SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', label, error, hint, options, placeholder, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-semibold text-gold mb-2 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full px-4 py-3
            bg-dark-wood/50 border border-gold/30 rounded-md
            text-cream
            focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50
            transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            appearance-none cursor-pointer
            ${error ? 'border-warm-red focus:border-warm-red focus:ring-warm-red/50' : ''}
            ${className}
          `}
          style={{
            backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23D4AF37' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
            backgroundPosition: 'right 0.75rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
          }}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
              {option.description ? ` - ${option.description}` : ''}
            </option>
          ))}
        </select>
        {hint && !error && (
          <p className="mt-1 text-xs text-cream/50">{hint}</p>
        )}
        {error && (
          <p className="mt-1 text-xs text-warm-red">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
