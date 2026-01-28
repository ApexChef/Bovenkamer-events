'use client';

import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { PredictionQuestion, PredictionQuestionType, PredictionCategory, PredictionQuestionOptions } from '@/types';
import { TypeSpecificFields } from './TypeSpecificFields';
import { QuestionPreview } from './QuestionPreview';

interface QuestionEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  question: PredictionQuestion | null;
  onSave: (data: any) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

interface EditorState {
  key: string;
  label: string;
  type: PredictionQuestionType;
  category: PredictionCategory;
  options: PredictionQuestionOptions;
  points_exact: number;
  points_close: number;
  points_direction: number;
  errors: Record<string, string>;
}

const TYPE_OPTIONS = [
  { value: 'slider', label: 'Slider' },
  { value: 'select_participant', label: 'Deelnemer selectie' },
  { value: 'boolean', label: 'Ja/Nee' },
  { value: 'time', label: 'Tijdstip' },
  { value: 'select_options', label: 'Keuze opties' },
];

const CATEGORY_OPTIONS = [
  { value: 'consumption', label: 'Consumptie' },
  { value: 'social', label: 'Sociaal' },
  { value: 'other', label: 'Overig' },
];

function getDefaultOptions(type: PredictionQuestionType): PredictionQuestionOptions {
  switch (type) {
    case 'slider':
      return { type: 'slider', min: 0, max: 100, unit: '', default: 50 };
    case 'select_participant':
      return { type: 'select_participant' };
    case 'boolean':
      return { type: 'boolean', trueLabel: 'Ja', falseLabel: 'Nee', trueEmoji: '✅', falseEmoji: '❌' };
    case 'time':
      return { type: 'time', minHour: 19, maxHour: 6, default: 10 };
    case 'select_options':
      return { type: 'select_options', choices: [] };
  }
}

export function QuestionEditor({ open, onOpenChange, question, onSave, onDelete }: QuestionEditorProps) {
  const [formState, setFormState] = useState<EditorState>({
    key: '',
    label: '',
    type: 'slider',
    category: 'consumption',
    options: getDefaultOptions('slider'),
    points_exact: 50,
    points_close: 25,
    points_direction: 10,
    errors: {},
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset form when question changes or modal opens/closes
  useEffect(() => {
    if (open) {
      if (question) {
        setFormState({
          key: question.key,
          label: question.label,
          type: question.type,
          category: question.category,
          options: question.options,
          points_exact: question.points_exact,
          points_close: question.points_close,
          points_direction: question.points_direction,
          errors: {},
        });
      } else {
        setFormState({
          key: '',
          label: '',
          type: 'slider',
          category: 'consumption',
          options: getDefaultOptions('slider'),
          points_exact: 50,
          points_close: 25,
          points_direction: 10,
          errors: {},
        });
      }
    }
  }, [open, question]);

  function handleTypeChange(type: PredictionQuestionType) {
    setFormState((prev) => ({
      ...prev,
      type,
      options: getDefaultOptions(type),
    }));
  }

  function validateForm(): boolean {
    const errors: Record<string, string> = {};

    // Validate key (only for new questions)
    if (!question) {
      if (!formState.key) {
        errors.key = 'Key is verplicht';
      } else if (!/^[a-z][a-z0-9_]*$/.test(formState.key)) {
        errors.key = 'Key moet beginnen met kleine letter en alleen kleine letters, cijfers en _ bevatten';
      }
    }

    // Validate label
    if (!formState.label || formState.label.length < 3) {
      errors.label = 'Label moet minimaal 3 tekens bevatten';
    }

    // Validate type-specific options
    if (formState.type === 'slider') {
      const opts = formState.options as any;
      if (opts.min >= opts.max) {
        errors.options = 'Min moet kleiner zijn dan max';
      }
      if (!opts.unit) {
        errors.unit = 'Unit is verplicht';
      }
    }

    if (formState.type === 'select_options') {
      const opts = formState.options as any;
      if (!opts.choices || opts.choices.length < 2) {
        errors.options = 'Minimaal 2 keuze opties vereist';
      }
    }

    setFormState((prev) => ({ ...prev, errors }));
    return Object.keys(errors).length === 0;
  }

  async function handleSave() {
    if (!validateForm()) {
      return;
    }

    setIsSaving(true);
    try {
      const data = question
        ? {
            label: formState.label,
            type: formState.type,
            category: formState.category,
            options: formState.options,
            points_exact: formState.points_exact,
            points_close: formState.points_close,
            points_direction: formState.points_direction,
          }
        : {
            key: formState.key,
            label: formState.label,
            type: formState.type,
            category: formState.category,
            options: formState.options,
            points_exact: formState.points_exact,
            points_close: formState.points_close,
            points_direction: formState.points_direction,
          };

      await onSave(data);
    } catch (error: any) {
      alert(error.message || 'Fout bij het opslaan');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    if (!question || !onDelete) return;

    const confirmed = confirm(
      'Weet je zeker dat je deze vraag wilt verwijderen? Dit kan niet ongedaan worden gemaakt.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await onDelete(question.id);
    } catch (error: any) {
      alert(error.message || 'Fout bij het verwijderen');
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-2xl overflow-y-auto bg-deep-green border-l border-gold/20">
        <SheetHeader>
          <SheetTitle className="text-gold">
            {question ? 'Vraag Bewerken' : 'Nieuwe Vraag'}
          </SheetTitle>
          <SheetDescription className="text-cream/60">
            {question ? 'Pas de vraag aan' : 'Voeg een nieuwe voorspelling toe'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Basic Fields */}
          <div className="space-y-4">
            <Select
              label="Type"
              value={formState.type}
              onChange={(e) => handleTypeChange(e.target.value as PredictionQuestionType)}
              options={TYPE_OPTIONS}
            />

            <Select
              label="Categorie"
              value={formState.category}
              onChange={(e) => setFormState({ ...formState, category: e.target.value as PredictionCategory })}
              options={CATEGORY_OPTIONS}
            />

            <Input
              label="Key"
              value={formState.key}
              onChange={(e) => setFormState({ ...formState, key: e.target.value })}
              error={formState.errors.key}
              hint="Unieke identifier (bijv. wineBottles)"
              disabled={!!question}
            />

            <Input
              label="Label"
              value={formState.label}
              onChange={(e) => setFormState({ ...formState, label: e.target.value })}
              error={formState.errors.label}
              hint="De vraag die gebruikers zien"
            />
          </div>

          {/* Type-Specific Fields */}
          <div className="border-t border-gold/10 pt-4">
            <h3 className="text-sm font-medium text-gold mb-3">Type Opties</h3>
            <TypeSpecificFields
              type={formState.type}
              options={formState.options}
              onChange={(options) => setFormState({ ...formState, options })}
              errors={formState.errors}
            />
          </div>

          {/* Points Configuration */}
          <div className="border-t border-gold/10 pt-4">
            <h3 className="text-sm font-medium text-gold mb-3">Punten</h3>
            <div className="space-y-3">
              <Input
                type="number"
                label="Exact"
                value={formState.points_exact}
                onChange={(e) => setFormState({ ...formState, points_exact: parseInt(e.target.value) || 0 })}
                hint="100% correct"
              />
              <Input
                type="number"
                label="Dichtbij"
                value={formState.points_close}
                onChange={(e) => setFormState({ ...formState, points_close: parseInt(e.target.value) || 0 })}
                hint="Binnen 10%"
              />
              <Input
                type="number"
                label="Richting"
                value={formState.points_direction}
                onChange={(e) => setFormState({ ...formState, points_direction: parseInt(e.target.value) || 0 })}
                hint="Goede richting (te hoog/laag)"
              />
            </div>
          </div>

          {/* Preview */}
          <div className="border-t border-gold/10 pt-4">
            <h3 className="text-sm font-medium text-gold mb-3">Preview</h3>
            <QuestionPreview question={{
              ...formState,
              id: 'preview',
              is_active: true,
              sort_order: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }} />
          </div>
        </div>

        <SheetFooter className="flex-col sm:flex-row gap-2">
          {question && onDelete && (
            <Button
              variant="ghost"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-warm-red hover:bg-warm-red/10 mr-auto"
            >
              {isDeleting ? 'Verwijderen...' : 'Verwijderen'}
            </Button>
          )}
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={isSaving || isDeleting}>
            Annuleren
          </Button>
          <Button onClick={handleSave} isLoading={isSaving} disabled={isDeleting}>
            Opslaan
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
