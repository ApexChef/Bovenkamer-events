'use client';

import { motion } from 'framer-motion';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  label?: string;
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  hint?: string;
}

export function RadioGroup({ label, name, options, value, onChange, hint }: RadioGroupProps) {
  return (
    <div className="w-full">
      {label && (
        <p className="block text-sm font-semibold text-gold mb-3 uppercase tracking-wider">
          {label}
        </p>
      )}
      <div className="flex gap-4">
        {options.map((option) => (
          <motion.label
            key={option.value}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border cursor-pointer transition-all
              ${
                value === option.value
                  ? 'bg-gold/20 border-gold text-gold'
                  : 'bg-dark-wood/30 border-gold/20 text-cream hover:border-gold/50'
              }
            `}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="sr-only"
            />
            <span className="font-semibold">{option.label}</span>
          </motion.label>
        ))}
      </div>
      {hint && (
        <p className="mt-2 text-xs text-cream/50">{hint}</p>
      )}
    </div>
  );
}
