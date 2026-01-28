'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { Button } from '@/components/ui/Button';
import { AuthGuard } from '@/components/AuthGuard';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { PredictionQuestion } from '@/types';
import { QuestionList } from '@/components/admin/predictions/QuestionList';
import { QuestionEditor } from '@/components/admin/predictions/QuestionEditor';

export default function AdminPredictionQuestionsPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <AdminPredictionQuestionsPageContent />
    </AuthGuard>
  );
}

interface AdminQuestionsResponse {
  questions: PredictionQuestion[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    byCategory: {
      consumption: number;
      social: number;
      other: number;
    };
    answerCounts: Record<string, number>;
  };
}

function AdminPredictionQuestionsPageContent() {
  const [state, setState] = useState<{
    questions: PredictionQuestion[];
    isLoading: boolean;
    error: string | null;
    selectedQuestion: PredictionQuestion | null;
    isEditorOpen: boolean;
    stats: AdminQuestionsResponse['stats'] | null;
  }>({
    questions: [],
    isLoading: true,
    error: null,
    selectedQuestion: null,
    isEditorOpen: false,
    stats: null,
  });

  // Fetch questions on mount
  useEffect(() => {
    fetchQuestions();
  }, []);

  async function fetchQuestions() {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch('/api/admin/prediction-questions');
      if (!response.ok) {
        throw new Error('Failed to fetch questions');
      }

      const data: AdminQuestionsResponse = await response.json();
      setState((prev) => ({
        ...prev,
        questions: data.questions,
        stats: data.stats,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error fetching questions:', error);
      setState((prev) => ({
        ...prev,
        error: 'Kon vragen niet laden',
        isLoading: false,
      }));
    }
  }

  function handleEdit(question: PredictionQuestion) {
    setState((prev) => ({
      ...prev,
      selectedQuestion: question,
      isEditorOpen: true,
    }));
  }

  function handleAddNew() {
    setState((prev) => ({
      ...prev,
      selectedQuestion: null,
      isEditorOpen: true,
    }));
  }

  function handleCloseEditor() {
    setState((prev) => ({
      ...prev,
      isEditorOpen: false,
      selectedQuestion: null,
    }));
  }

  async function handleToggleActive(id: string, isActive: boolean) {
    try {
      const response = await fetch(`/api/admin/prediction-questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) {
        throw new Error('Failed to toggle active status');
      }

      // Update local state
      setState((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === id ? { ...q, is_active: isActive } : q
        ),
      }));
    } catch (error) {
      console.error('Error toggling active status:', error);
      alert('Fout bij het wijzigen van de status');
    }
  }

  async function handleReorder(questions: PredictionQuestion[]) {
    const updates = questions.map((q, index) => ({
      id: q.id,
      sort_order: index * 10,
    }));

    try {
      const response = await fetch('/api/admin/prediction-questions/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questions: updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to reorder questions');
      }

      // Update local state with new sort orders
      setState((prev) => ({
        ...prev,
        questions: questions.map((q, i) => ({ ...q, sort_order: i * 10 })),
      }));
    } catch (error) {
      console.error('Error reordering questions:', error);
      throw error; // Let QuestionList handle rollback
    }
  }

  async function handleSave(
    data: any
  ): Promise<void> {
    const isEdit = !!state.selectedQuestion;
    const url = isEdit
      ? `/api/admin/prediction-questions/${state.selectedQuestion!.id}`
      : '/api/admin/prediction-questions';
    const method = isEdit ? 'PATCH' : 'POST';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to save question');
    }

    const { question } = await response.json();

    // Update local state
    if (isEdit) {
      setState((prev) => ({
        ...prev,
        questions: prev.questions.map((q) =>
          q.id === question.id ? question : q
        ),
      }));
    } else {
      setState((prev) => ({
        ...prev,
        questions: [...prev.questions, question],
      }));
    }

    handleCloseEditor();
  }

  async function handleDelete(id: string): Promise<void> {
    const response = await fetch(`/api/admin/prediction-questions/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete question');
    }

    // Remove from local state
    setState((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));

    handleCloseEditor();
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="text-cream/60 hover:text-gold text-sm mb-4 inline-block"
          >
            ← Terug naar admin dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-gold mb-2">
                Prediction Vragen
              </h1>
              <p className="text-cream/60">
                Beheer de voorspellingsvragen voor deelnemers
              </p>
            </div>
            <Button onClick={handleAddNew}>+ Nieuwe Vraag</Button>
          </div>
        </div>

        {/* Stats */}
        {state.stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold text-gold">{state.stats.total}</p>
                <p className="text-cream/50 text-sm mt-1">Totaal</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold text-success-green">
                  {state.stats.active}
                </p>
                <p className="text-cream/50 text-sm mt-1">Actief</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold text-cream/40">
                  {state.stats.inactive}
                </p>
                <p className="text-cream/50 text-sm mt-1">Inactief</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold text-gold">
                  {state.stats.byCategory.consumption}
                </p>
                <p className="text-cream/50 text-sm mt-1">Consumptie</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold text-gold">
                  {state.stats.byCategory.social + state.stats.byCategory.other}
                </p>
                <p className="text-cream/50 text-sm mt-1">Sociaal & Overig</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Loading State */}
        {state.isLoading && (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
              <p className="text-cream/60">Vragen laden...</p>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {state.error && (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-warm-red mb-4">{state.error}</p>
              <Button onClick={fetchQuestions}>Opnieuw proberen</Button>
            </CardContent>
          </Card>
        )}

        {/* Questions List */}
        {!state.isLoading && !state.error && (
          <QuestionList
            questions={state.questions}
            answerCounts={state.stats?.answerCounts || {}}
            onEdit={handleEdit}
            onToggleActive={handleToggleActive}
            onReorder={handleReorder}
          />
        )}

        {/* Question Editor Sheet */}
        <QuestionEditor
          open={state.isEditorOpen}
          onOpenChange={handleCloseEditor}
          question={state.selectedQuestion}
          onSave={handleSave}
          onDelete={state.selectedQuestion ? handleDelete : undefined}
        />
      </div>
    </DashboardLayout>
  );
}
