'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string;
  description?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', label, description, id, ...props }, ref) => {
    const checkboxId = id || label.toLowerCase().replace(/\s/g, '-');

    return (
      <label
        htmlFor={checkboxId}
        className={`flex items-start gap-3 cursor-pointer group ${className}`}
      >
        <div className="relative flex-shrink-0 mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={checkboxId}
            className="peer sr-only"
            {...props}
          />
          <div className="w-5 h-5 border-2 border-gold/50 rounded bg-dark-wood/50 peer-checked:bg-gold peer-checked:border-gold transition-all duration-200 group-hover:border-gold">
            <svg
              className="w-full h-full text-dark-wood opacity-0 peer-checked:opacity-100 transition-opacity duration-200"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        </div>
        <div className="flex flex-col">
          <span className="text-cream font-medium group-hover:text-gold transition-colors">
            {label}
          </span>
          {description && (
            <span className="text-sm text-cream/50">{description}</span>
          )}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
