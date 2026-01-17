'use client';

import { useRef, useState, useEffect, forwardRef, useImperativeHandle } from 'react';

interface PINInputProps {
  value?: string;
  onChange?: (pin: string) => void;
  onComplete?: (pin: string) => void;
  error?: string;
  label?: string;
  hint?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}

export interface PINInputRef {
  focus: () => void;
  clear: () => void;
  getValue: () => string;
}

export const PINInput = forwardRef<PINInputRef, PINInputProps>(
  ({ value = '', onChange, onComplete, error, label, hint, disabled, autoFocus }, ref) => {
    const [pins, setPins] = useState(['', '', '', '']);
    const inputRefs = [
      useRef<HTMLInputElement>(null),
      useRef<HTMLInputElement>(null),
      useRef<HTMLInputElement>(null),
      useRef<HTMLInputElement>(null),
    ];

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => {
        const firstEmptyIndex = pins.findIndex(p => !p);
        const targetIndex = firstEmptyIndex >= 0 ? firstEmptyIndex : 0;
        inputRefs[targetIndex].current?.focus();
      },
      clear: () => {
        setPins(['', '', '', '']);
        inputRefs[0].current?.focus();
      },
      getValue: () => pins.join(''),
    }));

    // Sync with external value
    useEffect(() => {
      if (value && value.length <= 4) {
        const chars = value.split('');
        setPins([
          chars[0] || '',
          chars[1] || '',
          chars[2] || '',
          chars[3] || '',
        ]);
      }
    }, [value]);

    // Auto-focus first input on mount
    useEffect(() => {
      if (autoFocus) {
        inputRefs[0].current?.focus();
      }
    }, [autoFocus]);

    const handleChange = (index: number, val: string) => {
      const newVal = val.toUpperCase();

      // Validate input based on index
      if (index < 2) {
        // First two inputs: only letters
        if (newVal && !/^[A-Z]$/.test(newVal)) return;
      } else {
        // Last two inputs: only digits
        if (newVal && !/^[0-9]$/.test(newVal)) return;
      }

      const newPins = [...pins];
      newPins[index] = newVal;
      setPins(newPins);

      const fullPin = newPins.join('');
      onChange?.(fullPin);

      // Auto-focus next input
      if (newVal && index < 3) {
        inputRefs[index + 1].current?.focus();
      }

      // Call onComplete when all 4 characters are entered
      if (fullPin.length === 4) {
        onComplete?.(fullPin);
      }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      // Handle backspace
      if (e.key === 'Backspace' && !pins[index] && index > 0) {
        inputRefs[index - 1].current?.focus();
      }

      // Handle arrow keys
      if (e.key === 'ArrowLeft' && index > 0) {
        e.preventDefault();
        inputRefs[index - 1].current?.focus();
      }
      if (e.key === 'ArrowRight' && index < 3) {
        e.preventDefault();
        inputRefs[index + 1].current?.focus();
      }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
      e.preventDefault();
      const pastedData = e.clipboardData.getData('text').toUpperCase().slice(0, 4);

      // Validate format: 2 letters + 2 digits
      if (!/^[A-Z]{2}[0-9]{2}$/.test(pastedData)) {
        return;
      }

      const chars = pastedData.split('');
      const newPins = [
        chars[0] || '',
        chars[1] || '',
        chars[2] || '',
        chars[3] || '',
      ];
      setPins(newPins);
      onChange?.(pastedData);

      // Focus last input
      inputRefs[3].current?.focus();

      if (pastedData.length === 4) {
        onComplete?.(pastedData);
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-gold mb-2 uppercase tracking-wider">
            {label}
          </label>
        )}

        <div className="flex gap-2 justify-center">
          {pins.map((pin, index) => (
            <div key={index} className="relative">
              <input
                ref={inputRefs[index]}
                type="text"
                maxLength={1}
                value={pin}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                disabled={disabled}
                className={`
                  w-14 h-16 text-center text-2xl font-bold
                  bg-dark-wood/50 border-2 rounded-lg
                  text-cream uppercase
                  focus:outline-none transition-all duration-200
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${error
                    ? 'border-warm-red focus:border-warm-red focus:ring-2 focus:ring-warm-red/50'
                    : 'border-gold/30 focus:border-gold focus:ring-2 focus:ring-gold/50'
                  }
                  ${pin ? 'border-gold/60' : ''}
                `}
                aria-label={`PIN karakter ${index + 1} ${index < 2 ? '(letter)' : '(cijfer)'}`}
              />
              {index === 1 && (
                <div className="absolute -right-3 top-1/2 -translate-y-1/2 text-gold/40 text-xl font-bold">
                  -
                </div>
              )}
            </div>
          ))}
        </div>

        {hint && !error && (
          <p className="mt-2 text-xs text-cream/50 text-center">{hint}</p>
        )}
        {error && (
          <p className="mt-2 text-xs text-warm-red text-center">{error}</p>
        )}
      </div>
    );
  }
);

PINInput.displayName = 'PINInput';
