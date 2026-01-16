'use client';

import { forwardRef, InputHTMLAttributes } from 'react';

interface SliderProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
  hint?: string;
  min: number;
  max: number;
  showValue?: boolean;
  unit?: string;
}

export const Slider = forwardRef<HTMLInputElement, SliderProps>(
  ({ className = '', label, hint, min, max, value, showValue = true, unit = '', id, ...props }, ref) => {
    const sliderId = id || label?.toLowerCase().replace(/\s/g, '-');

    return (
      <div className="w-full">
        {label && (
          <div className="flex justify-between items-center mb-2">
            <label
              htmlFor={sliderId}
              className="block text-sm font-semibold text-gold uppercase tracking-wider"
            >
              {label}
            </label>
            {showValue && (
              <span className="text-gold font-bold text-lg">
                {value}{unit}
              </span>
            )}
          </div>
        )}
        <input
          ref={ref}
          type="range"
          id={sliderId}
          min={min}
          max={max}
          value={value}
          className={`
            w-full h-2 rounded-full appearance-none cursor-pointer
            bg-dark-wood border border-gold/30
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-5
            [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-gold
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:h-5
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-gold
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer
            ${className}
          `}
          {...props}
        />
        <div className="flex justify-between mt-1 text-xs text-cream/40">
          <span>{min}{unit}</span>
          <span>{max}{unit}</span>
        </div>
        {hint && (
          <p className="mt-2 text-xs text-cream/50">{hint}</p>
        )}
      </div>
    );
  }
);

Slider.displayName = 'Slider';
