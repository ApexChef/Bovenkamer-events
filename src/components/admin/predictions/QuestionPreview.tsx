'use client';

import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import { RadioGroup } from '@/components/ui/RadioGroup';
import {
  PredictionQuestion,
  SliderOptions,
  BooleanOptions,
  TimeOptions,
  SelectOptionsOptions,
} from '@/types';

interface QuestionPreviewProps {
  question: Partial<PredictionQuestion>;
}

function formatTimeValue(value: number): string {
  const totalMinutes = 19 * 60 + value * 30;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const minutes = totalMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

export function QuestionPreview({ question }: QuestionPreviewProps) {
  if (!question.type || !question.options) {
    return (
      <div className="p-4 bg-deep-green/50 border border-cream/10 rounded-lg">
        <p className="text-cream/60 text-sm text-center">
          Vul de velden in om een preview te zien
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-deep-green/50 border border-cream/10 rounded-lg">
      <div className="pointer-events-none opacity-90">
        {renderQuestion(question as PredictionQuestion)}
      </div>
      <p className="text-cream/40 text-xs mt-3 text-center">
        Preview - niet interactief
      </p>
    </div>
  );
}

function renderQuestion(question: PredictionQuestion) {
  switch (question.type) {
    case 'slider': {
      const opts = question.options as SliderOptions;
      return (
        <Slider
          label={question.label || 'Label'}
          min={opts.min}
          max={opts.max}
          value={opts.default ?? opts.min ?? 0}
          onChange={() => {}}
          unit={opts.unit}
          hint={opts.hint}
        />
      );
    }

    case 'select_participant': {
      return (
        <Select
          label={question.label || 'Label'}
          options={[
            { value: '1', label: 'Voorbeeld Deelnemer 1' },
            { value: '2', label: 'Voorbeeld Deelnemer 2' },
            { value: '3', label: 'Voorbeeld Deelnemer 3' },
          ]}
          placeholder="Selecteer een deelnemer"
          value=""
          onChange={() => {}}
        />
      );
    }

    case 'boolean': {
      const opts = question.options as BooleanOptions;
      return (
        <RadioGroup
          label={question.label || 'Label'}
          name="preview"
          options={[
            {
              value: 'true',
              label: `${opts.trueEmoji || '✅'} ${opts.trueLabel || 'Ja'}`,
            },
            {
              value: 'false',
              label: `${opts.falseEmoji || '❌'} ${opts.falseLabel || 'Nee'}`,
            },
          ]}
          value=""
          onChange={() => {}}
        />
      );
    }

    case 'time': {
      const opts = question.options as TimeOptions;
      return (
        <Slider
          label={question.label || 'Label'}
          min={0}
          max={22}
          value={opts.default ?? 10}
          onChange={() => {}}
          formatValue={formatTimeValue}
          formatMin="19:00"
          formatMax="06:00"
        />
      );
    }

    case 'select_options': {
      const opts = question.options as SelectOptionsOptions;
      const selectOptions = (opts.choices || []).map((choice) => ({
        value: choice.value || choice.label,
        label: choice.emoji ? `${choice.emoji} ${choice.label}` : choice.label,
      }));

      if (selectOptions.length === 0) {
        return (
          <div className="text-cream/60 text-sm">
            Voeg opties toe om preview te zien
          </div>
        );
      }

      return (
        <Select
          label={question.label || 'Label'}
          options={selectOptions}
          placeholder="Selecteer een optie"
          value=""
          onChange={() => {}}
        />
      );
    }

    default:
      return (
        <div className="text-warm-red text-sm">
          Onbekend vraagtype: {question.type}
        </div>
      );
  }
}
