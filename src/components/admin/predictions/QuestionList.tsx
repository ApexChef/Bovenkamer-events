'use client';

import { useState } from 'react';
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { PredictionQuestion, PredictionCategory } from '@/types';
import { SortableQuestionItem } from './SortableQuestionItem';

interface QuestionListProps {
  questions: PredictionQuestion[];
  answerCounts: Record<string, number>;
  onEdit: (question: PredictionQuestion) => void;
  onToggleActive: (id: string, isActive: boolean) => Promise<void>;
  onReorder: (questions: PredictionQuestion[]) => Promise<void>;
}

const CATEGORY_LABELS: Record<PredictionCategory, string> = {
  consumption: 'Consumptie',
  social: 'Sociaal',
  other: 'Overig',
};

const CATEGORY_ORDER: PredictionCategory[] = ['consumption', 'social', 'other'];

export function QuestionList({
  questions,
  answerCounts,
  onEdit,
  onToggleActive,
  onReorder,
}: QuestionListProps) {
  const [localQuestions, setLocalQuestions] = useState(questions);
  const [activeCategory, setActiveCategory] = useState<PredictionCategory | null>(null);

  // Update local state when props change
  if (questions !== localQuestions) {
    setLocalQuestions(questions);
  }

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement required to start drag
      },
    })
  );

  // Group questions by category
  const questionsByCategory = localQuestions.reduce((acc, question) => {
    if (!acc[question.category]) {
      acc[question.category] = [];
    }
    acc[question.category].push(question);
    return acc;
  }, {} as Record<PredictionCategory, PredictionQuestion[]>);

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent, category: PredictionCategory) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      setActiveCategory(null);
      return;
    }

    const categoryQuestions = questionsByCategory[category];
    const oldIndex = categoryQuestions.findIndex((q) => q.id === active.id);
    const newIndex = categoryQuestions.findIndex((q) => q.id === over.id);

    // Reorder within category
    const reordered = arrayMove(categoryQuestions, oldIndex, newIndex);

    // Merge back with other categories
    const otherCategoryQuestions = localQuestions.filter((q) => q.category !== category);
    const allQuestions = [...otherCategoryQuestions, ...reordered];

    // Optimistic update
    setLocalQuestions(allQuestions);
    setActiveCategory(null);

    // Persist to server
    onReorder(allQuestions).catch(() => {
      // Rollback on error
      setLocalQuestions(localQuestions);
      alert('Fout bij het opslaan van de volgorde');
    });
  };

  return (
    <div className="space-y-6">
      {CATEGORY_ORDER.map((category) => {
        const categoryQuestions = (questionsByCategory[category] || []).sort(
          (a, b) => a.sort_order - b.sort_order
        );

        if (categoryQuestions.length === 0) {
          return null;
        }

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{CATEGORY_LABELS[category]}</CardTitle>
            </CardHeader>
            <CardContent>
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragStart={() => setActiveCategory(category)}
                onDragEnd={(event) => handleDragEnd(event, category)}
              >
                <SortableContext
                  items={categoryQuestions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {categoryQuestions.map((question) => (
                      <SortableQuestionItem
                        key={question.id}
                        question={question}
                        answerCount={answerCounts[question.id] || 0}
                        onEdit={onEdit}
                        onToggleActive={onToggleActive}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </CardContent>
          </Card>
        );
      })}

      {localQuestions.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-cream/60 mb-4">Geen vragen gevonden</p>
            <p className="text-cream/40 text-sm">
              Klik op &ldquo;Nieuwe Vraag&rdquo; om een vraag toe te voegen
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
