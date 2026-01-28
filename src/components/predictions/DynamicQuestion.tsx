'use client';

import {
  PredictionQuestion,
  SliderOptions,
  BooleanOptions,
  TimeOptions,
  SelectOptionsOptions,
} from '@/types';
import { Slider, Select, RadioGroup } from '@/components/ui';

interface DynamicQuestionProps {
  question: PredictionQuestion;
  value: string | number | boolean | undefined;
  onChange: (value: string | number | boolean) => void;
  disabled?: boolean;
  participants?: Array<{ value: string; label: string }>;
}

/**
 * DynamicQuestion Component
 *
 * Renders a prediction question dynamically based on its type.
 * Supports: slider, select_participant, boolean, time, select_options
 */
export function DynamicQuestion({
  question,
  value,
  onChange,
  disabled = false,
  participants = [],
}: DynamicQuestionProps) {
  switch (question.type) {
    case 'slider': {
      const opts = question.options as SliderOptions;
      const sliderValue = (value as number) ?? opts.default ?? opts.min;

      return (
        <Slider
          label={question.label}
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

    case 'select_participant': {
      return (
        <Select
          label={question.label}
          options={participants}
          placeholder="Selecteer een deelnemer"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    }

    case 'boolean': {
      const opts = question.options as BooleanOptions;
      const trueLabel = opts.trueLabel || 'Ja';
      const falseLabel = opts.falseLabel || 'Nee';
      const trueEmoji = opts.trueEmoji || '✅';
      const falseEmoji = opts.falseEmoji || '❌';

      return (
        <RadioGroup
          label={question.label}
          name={question.key}
          options={[
            {
              value: 'true',
              label: `${trueEmoji} ${trueLabel}`,
            },
            {
              value: 'false',
              label: `${falseEmoji} ${falseLabel}`,
            },
          ]}
          value={value === undefined ? '' : value.toString()}
          onChange={(v) => onChange(v === 'true')}
        />
      );
    }

    case 'time': {
      const opts = question.options as TimeOptions;
      const timeValue = (value as number) ?? opts.default ?? 10;

      return (
        <Slider
          label={question.label}
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

    case 'select_options': {
      const opts = question.options as SelectOptionsOptions;
      const selectOptions = opts.choices.map((choice) => ({
        value: choice.value,
        label: choice.emoji ? `${choice.emoji} ${choice.label}` : choice.label,
      }));

      return (
        <Select
          label={question.label}
          options={selectOptions}
          placeholder="Selecteer een optie"
          value={(value as string) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
        />
      );
    }

    default:
      return (
        <p className="text-warm-red">
          Onbekend vraagtype: {(question as any).type}
        </p>
      );
  }
}

/**
 * Format time slider value to HH:MM
 * Value 0 = 19:00, Value 22 = 06:00 (next day)
 * Half-hour increments
 */
function formatTimeSlider(value: number): string {
  const totalMinutes = 19 * 60 + value * 30;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}
