'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PredictionQuestion } from '@/types';
import { cn } from '@/lib/utils';

interface SortableQuestionItemProps {
  question: PredictionQuestion;
  answerCount: number;
  onEdit: (question: PredictionQuestion) => void;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
}

const TYPE_LABELS: Record<string, string> = {
  slider: 'Slider',
  select_participant: 'Deelnemer selectie',
  boolean: 'Ja/Nee',
  time: 'Tijdstip',
  select_options: 'Keuze opties',
};

export function SortableQuestionItem({
  question,
  answerCount,
  onEdit,
  onToggleActive,
}: SortableQuestionItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: question.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 bg-dark-wood/50 rounded-lg border border-gold/10',
        'hover:bg-dark-wood/70 hover:border-gold/30 transition-colors',
        isDragging && 'opacity-50 shadow-xl border-gold/50'
      )}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="w-5 h-5 text-cream/40 hover:text-gold transition-colors" />
      </div>

      {/* Question Info */}
      <div className="flex-1 min-w-0">
        <p className="text-cream font-medium truncate">{question.label}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-cream/50 text-sm">{TYPE_LABELS[question.type]}</span>
          <span className="text-cream/30 text-sm">•</span>
          <span className="text-cream/50 text-sm">{answerCount} antwoorden</span>
        </div>
      </div>

      {/* Active Toggle */}
      <button
        onClick={() => onToggleActive(question.id, !question.is_active)}
        className={cn(
          'relative w-12 h-6 rounded-full transition-colors duration-200',
          question.is_active ? 'bg-success-green' : 'bg-dark-wood border border-gold/20'
        )}
        title={question.is_active ? 'Actief' : 'Inactief'}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 bg-cream rounded-full transition-transform duration-200',
            question.is_active ? 'translate-x-6' : 'translate-x-0.5'
          )}
        />
      </button>

      {/* Edit Button */}
      <Button variant="ghost" size="sm" onClick={() => onEdit(question)}>
        <Pencil className="w-4 h-4" />
      </Button>
    </div>
  );
}
