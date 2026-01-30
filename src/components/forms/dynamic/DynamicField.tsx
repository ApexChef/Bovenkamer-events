'use client';

import {
  FormField,
  SliderOptions,
  BooleanOptions,
  TimeOptions,
  SelectOptionsOptions,
  StarRatingOptions,
  TextLongOptions,
} from '@/types';
import { Slider, Select, RadioGroup, TextArea, Input } from '@/components/ui';

interface DynamicFieldProps {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  disabled?: boolean;
  participants?: Array<{ value: string; label: string }>;
}

/**
 * DynamicField renders a single form field based on its field_type.
 * Supports all FormFieldType values from the database.
 */
export function DynamicField({
  field,
  value,
  onChange,
  disabled = false,
  participants = [],
}: DynamicFieldProps) {
  switch (field.field_type) {
    case 'star_rating': {
      const opts = field.options as StarRatingOptions;
      const maxStars = opts.maxStars || 5;
      const current = (value as number) || 0;

      return (
        <div className="space-y-2">
          <div>
            <p className="text-cream font-medium">{field.label}</p>
            {field.description && (
              <p className="text-cream/50 text-sm">{field.description}</p>
            )}
          </div>
          <div className="flex gap-2">
            {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => !disabled && onChange(star)}
                disabled={disabled}
                className={`w-10 h-10 rounded-lg border-2 transition-all ${
                  star <= current
                    ? 'bg-gold border-gold text-dark-wood'
                    : 'bg-transparent border-gold/30 text-gold/30 hover:border-gold/60'
                } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      );
    }

    case 'text_short': {
      return (
        <Input
          label={field.label}
          placeholder={field.placeholder || ''}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    }

    case 'text_long': {
      const opts = field.options as TextLongOptions;
      return (
        <TextArea
          label={field.label}
          placeholder={field.placeholder || ''}
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          rows={opts.rows || 3}
          disabled={disabled}
        />
      );
    }

    case 'boolean': {
      const opts = field.options as BooleanOptions;
      const trueLabel = opts.trueLabel || 'Ja';
      const falseLabel = opts.falseLabel || 'Nee';
      const trueEmoji = opts.trueEmoji || '';
      const falseEmoji = opts.falseEmoji || '';

      return (
        <div className="space-y-2">
          <p className="text-cream font-medium">{field.label}</p>
          {field.description && (
            <p className="text-cream/50 text-sm">{field.description}</p>
          )}
          <div className="flex justify-center gap-4 py-2">
            <button
              type="button"
              onClick={() => !disabled && onChange(true)}
              disabled={disabled}
              className={`px-8 py-4 rounded-lg border-2 font-semibold uppercase tracking-wider transition-all ${
                value === true
                  ? 'bg-success-green border-success-green text-cream'
                  : 'bg-transparent border-success-green/50 text-success-green hover:border-success-green'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {trueEmoji && `${trueEmoji} `}{trueLabel}
            </button>
            <button
              type="button"
              onClick={() => !disabled && onChange(false)}
              disabled={disabled}
              className={`px-8 py-4 rounded-lg border-2 font-semibold uppercase tracking-wider transition-all ${
                value === false
                  ? 'bg-warm-red border-warm-red text-cream'
                  : 'bg-transparent border-warm-red/50 text-warm-red hover:border-warm-red'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {falseEmoji && `${falseEmoji} `}{falseLabel}
            </button>
          </div>
        </div>
      );
    }

    case 'slider': {
      const opts = field.options as SliderOptions;
      const sliderValue = (value as number) ?? opts.default ?? opts.min;

      return (
        <Slider
          label={field.label}
          min={opts.min}
          max={opts.max}
          value={sliderValue}
          onChange={(e) => onChange(parseInt(e.target.value))}
          unit={opts.unit}
          hint={opts.hint}
          disabled={disabled}
        />
      );
    }

    case 'time': {
      const opts = field.options as TimeOptions;
      const timeValue = (value as number) ?? opts.default ?? 10;

      return (
        <Slider
          label={field.label}
          min={0}
          max={22}
          value={timeValue}
          onChange={(e) => onChange(parseInt(e.target.value))}
          formatValue={formatTimeSlider}
          formatMin="19:00"
          formatMax="06:00"
          disabled={disabled}
        />
      );
    }

    case 'select_participant': {
      return (
        <div className="space-y-2">
          <div>
            <p className="text-sm font-semibold text-gold uppercase tracking-wider">{field.label}</p>
            {field.description && (
              <p className="text-cream/50 text-sm mt-1">{field.description}</p>
            )}
          </div>
          <Select
            options={participants}
            placeholder="Selecteer een deelnemer"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          />
        </div>
      );
    }

    case 'select_options': {
      const opts = field.options as SelectOptionsOptions;
      const selectOptions = opts.choices.map((choice) => ({
        value: choice.value,
        label: choice.emoji ? `${choice.emoji} ${choice.label}` : choice.label,
      }));

      return (
        <Select
          label={field.label}
          options={selectOptions}
          placeholder="Selecteer een optie"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    }

    case 'radio_group': {
      const opts = field.options as SelectOptionsOptions;
      const radioOptions = opts.choices.map((choice) => ({
        value: choice.value,
        label: choice.emoji ? `${choice.emoji} ${choice.label}` : choice.label,
      }));

      return (
        <RadioGroup
          label={field.label}
          name={field.key}
          options={radioOptions}
          value={(value as string) ?? ''}
          onChange={(v) => onChange(v)}
        />
      );
    }

    default:
      return (
        <p className="text-warm-red">
          Onbekend veldtype: {field.field_type}
        </p>
      );
  }
}

function formatTimeSlider(value: number): string {
  const totalMinutes = 19 * 60 + value * 30;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
