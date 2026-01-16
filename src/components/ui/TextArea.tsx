'use client';

import { forwardRef, TextareaHTMLAttributes } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className = '', label, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-semibold text-gold mb-2 uppercase tracking-wider"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={`
            w-full px-4 py-3
            bg-dark-wood/50 border border-gold/30 rounded-md
            text-cream placeholder-cream/40
            focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50
            transition-colors duration-200
            disabled:opacity-50 disabled:cursor-not-allowed
            resize-none
            ${error ? 'border-warm-red focus:border-warm-red focus:ring-warm-red/50' : ''}
            ${className}
          `}
          rows={4}
          {...props}
        />
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

TextArea.displayName = 'TextArea';
