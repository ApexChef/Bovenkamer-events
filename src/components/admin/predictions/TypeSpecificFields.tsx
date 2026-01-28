'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import {
  PredictionQuestionType,
  PredictionQuestionOptions,
  SliderOptions,
  BooleanOptions,
  TimeOptions,
  SelectOptionsOptions,
  SelectChoice,
} from '@/types';
import { EmojiPicker } from './EmojiPicker';

interface TypeSpecificFieldsProps {
  type: PredictionQuestionType;
  options: PredictionQuestionOptions;
  onChange: (options: PredictionQuestionOptions) => void;
  errors: Record<string, string>;
}

export function TypeSpecificFields({ type, options, onChange, errors }: TypeSpecificFieldsProps) {
  switch (type) {
    case 'slider':
      return <SliderFields options={options as SliderOptions} onChange={onChange} errors={errors} />;
    case 'select_participant':
      return <SelectParticipantFields />;
    case 'boolean':
      return <BooleanFields options={options as BooleanOptions} onChange={onChange} errors={errors} />;
    case 'time':
      return <TimeFields options={options as TimeOptions} onChange={onChange} errors={errors} />;
    case 'select_options':
      return <SelectOptionsFields options={options as SelectOptionsOptions} onChange={onChange} errors={errors} />;
    default:
      return null;
  }
}

// Slider Fields
function SliderFields({
  options,
  onChange,
  errors,
}: {
  options: SliderOptions;
  onChange: (options: PredictionQuestionOptions) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <Input
          type="number"
          label="Min"
          value={options.min}
          onChange={(e) => onChange({ ...options, min: parseInt(e.target.value) || 0 })}
          error={errors['options.min']}
        />
        <Input
          type="number"
          label="Max"
          value={options.max}
          onChange={(e) => onChange({ ...options, max: parseInt(e.target.value) || 0 })}
          error={errors['options.max']}
        />
      </div>
      <Input
        label="Unit"
        value={options.unit}
        onChange={(e) => onChange({ ...options, unit: e.target.value })}
        hint="bijv. ' flessen', '°C', ' kg'"
        error={errors.unit}
      />
      <Input
        type="number"
        label="Default waarde (optioneel)"
        value={options.default ?? ''}
        onChange={(e) => onChange({ ...options, default: parseInt(e.target.value) || undefined })}
      />
      <Input
        label="Hint (optioneel)"
        value={options.hint ?? ''}
        onChange={(e) => onChange({ ...options, hint: e.target.value || undefined })}
        hint="bijv. '~20 personen = 15'"
      />
    </div>
  );
}

// Select Participant Fields (no configuration needed)
function SelectParticipantFields() {
  return (
    <div className="p-4 bg-dark-wood/30 rounded-lg border border-gold/10">
      <p className="text-cream/60 text-sm">
        Deze vraagtype toont automatisch een lijst van alle deelnemers.
        Geen extra configuratie nodig.
      </p>
    </div>
  );
}

// Boolean Fields
function BooleanFields({
  options,
  onChange,
  errors,
}: {
  options: BooleanOptions;
  onChange: (options: PredictionQuestionOptions) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-semibold text-gold mb-2 uppercase tracking-wider">
            Waar Label
          </label>
          <div className="flex gap-2">
            <EmojiPicker
              value={options.trueEmoji || '✅'}
              onChange={(emoji) => onChange({ ...options, trueEmoji: emoji })}
            />
            <Input
              value={options.trueLabel || 'Ja'}
              onChange={(e) => onChange({ ...options, trueLabel: e.target.value })}
              placeholder="Ja"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-gold mb-2 uppercase tracking-wider">
            Onwaar Label
          </label>
          <div className="flex gap-2">
            <EmojiPicker
              value={options.falseEmoji || '❌'}
              onChange={(emoji) => onChange({ ...options, falseEmoji: emoji })}
            />
            <Input
              value={options.falseLabel || 'Nee'}
              onChange={(e) => onChange({ ...options, falseLabel: e.target.value })}
              placeholder="Nee"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Time Fields
function TimeFields({
  options,
  onChange,
  errors,
}: {
  options: TimeOptions;
  onChange: (options: PredictionQuestionOptions) => void;
  errors: Record<string, string>;
}) {
  return (
    <div className="space-y-3">
      <div className="p-4 bg-dark-wood/30 rounded-lg border border-gold/10">
        <p className="text-cream/60 text-sm mb-2">
          Tijdstip wordt getoond als slider van 19:00 tot 06:00 (volgende dag) in stappen van 30 minuten.
        </p>
        <p className="text-cream/50 text-xs">
          Default waarde: 0 = 19:00, 10 = 00:00, 22 = 06:00
        </p>
      </div>
      <Input
        type="number"
        label="Default waarde (optioneel)"
        value={options.default ?? ''}
        onChange={(e) => {
          const val = parseInt(e.target.value);
          onChange({ ...options, default: !isNaN(val) ? Math.max(0, Math.min(22, val)) : undefined });
        }}
        hint="Getal tussen 0 en 22"
      />
    </div>
  );
}

// Select Options Fields
function SelectOptionsFields({
  options,
  onChange,
  errors,
}: {
  options: SelectOptionsOptions;
  onChange: (options: PredictionQuestionOptions) => void;
  errors: Record<string, string>;
}) {
  const [choices, setChoices] = useState<SelectChoice[]>(options.choices || []);

  const addChoice = () => {
    const updated = [...choices, { value: '', label: '', emoji: '' }];
    setChoices(updated);
    onChange({ ...options, choices: updated });
  };

  const updateChoice = (index: number, field: keyof SelectChoice, value: string) => {
    const updated = [...choices];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-generate value from label if value is empty
    if (field === 'label' && !updated[index].value) {
      updated[index].value = value.toLowerCase().replace(/\s+/g, '_');
    }

    setChoices(updated);
    onChange({ ...options, choices: updated });
  };

  const removeChoice = (index: number) => {
    const updated = choices.filter((_, i) => i !== index);
    setChoices(updated);
    onChange({ ...options, choices: updated });
  };

  return (
    <div className="space-y-3">
      {errors.options && (
        <div className="p-3 bg-warm-red/10 border border-warm-red/30 rounded text-warm-red text-sm">
          {errors.options}
        </div>
      )}

      {choices.map((choice, index) => (
        <div key={index} className="flex gap-2 items-start">
          {/* Emoji Picker */}
          <EmojiPicker
            value={choice.emoji || ''}
            onChange={(emoji) => updateChoice(index, 'emoji', emoji)}
          />

          {/* Label Input */}
          <div className="flex-1">
            <Input
              placeholder="Label (bijv. Varkensvlees)"
              value={choice.label}
              onChange={(e) => updateChoice(index, 'label', e.target.value)}
              error={errors[`choices.${index}.label`]}
            />
          </div>

          {/* Value Input (auto-generated) */}
          <div className="flex-1">
            <Input
              placeholder="Value (automatisch)"
              value={choice.value}
              onChange={(e) => updateChoice(index, 'value', e.target.value)}
              hint={!choice.value && choice.label ? `Auto: ${choice.label.toLowerCase().replace(/\s+/g, '_')}` : undefined}
            />
          </div>

          {/* Remove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeChoice(index)}
            className="text-warm-red hover:bg-warm-red/10 mt-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}

      <Button variant="secondary" onClick={addChoice} className="w-full">
        + Optie toevoegen
      </Button>
    </div>
  );
}
