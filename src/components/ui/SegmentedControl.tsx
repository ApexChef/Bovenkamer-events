'use client';

interface SegmentOption {
  value: number;
  label: string;
  emoji?: string;
}

interface SegmentedControlProps {
  label: string;
  options: SegmentOption[];
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}

export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  disabled = false,
}: SegmentedControlProps) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-cream">{label}</label>
      <div className="flex rounded-lg overflow-hidden border border-cream/20 bg-deep-green/30">
        {options.map((option, index) => {
          const isSelected = value === option.value;
          const isFirst = index === 0;
          const isLast = index === options.length - 1;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !disabled && onChange(option.value)}
              disabled={disabled}
              className={`
                flex-1 py-3 px-2 text-sm font-medium transition-all duration-200
                ${isSelected
                  ? 'bg-gold text-deep-green shadow-inner'
                  : 'text-cream/70 hover:text-cream hover:bg-cream/5'
                }
                ${!isFirst && 'border-l border-cream/10'}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                ${isFirst ? 'rounded-l-lg' : ''}
                ${isLast ? 'rounded-r-lg' : ''}
              `}
            >
              <div className="flex flex-col items-center gap-1">
                {option.emoji && <span className="text-lg">{option.emoji}</span>}
                <span className="text-xs whitespace-nowrap">{option.label}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
