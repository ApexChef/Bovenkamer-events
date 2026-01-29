'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { DynamicField } from './DynamicField';
import type { FormStructure, FormSectionWithFields } from '@/types';

interface DynamicFormProps {
  formKey: string;
  email: string;
  onSubmitSuccess?: () => void;
  onError?: (error: string) => void;
  participants?: Array<{ value: string; label: string }>;
  /** Custom submit button render. Receives isValid, isLoading, and submit handler. */
  renderFooter?: (props: {
    isValid: boolean;
    isLoading: boolean;
    onSubmit: () => void;
  }) => React.ReactNode;
}

/**
 * DynamicForm loads a form definition from the API and renders it
 * with sections and dynamic fields. Handles saving and submitting responses.
 */
export function DynamicForm({
  formKey,
  email,
  onSubmitSuccess,
  onError,
  participants = [],
  renderFooter,
}: DynamicFormProps) {
  const [form, setForm] = useState<FormStructure | null>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Load form structure and existing answers
  useEffect(() => {
    async function loadForm() {
      try {
        setIsLoading(true);
        setError(null);

        // Load form structure and existing answers in parallel
        const [formRes, answersRes] = await Promise.all([
          fetch(`/api/forms/${formKey}`),
          email ? fetch(`/api/forms/${formKey}/response?email=${encodeURIComponent(email)}`) : null,
        ]);

        if (!formRes.ok) {
          const err = await formRes.json();
          throw new Error(err.error || 'Kon formulier niet laden');
        }

        const formData: FormStructure = await formRes.json();
        setForm(formData);

        // Load existing answers if available
        if (answersRes?.ok) {
          const answerData = await answersRes.json();
          if (answerData.answers) {
            setAnswers(answerData.answers);
          }
          if (answerData.response?.status === 'submitted') {
            setIsSubmitted(true);
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Kon formulier niet laden';
        setError(message);
        onError?.(message);
      } finally {
        setIsLoading(false);
      }
    }

    loadForm();
  }, [formKey, email, onError]);

  const handleFieldChange = useCallback((fieldKey: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [fieldKey]: value }));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!email || isSubmitting) return;

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/forms/${formKey}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          answers,
          submit: true,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Kon formulier niet indienen');
      }

      setIsSubmitted(true);
      onSubmitSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Kon formulier niet indienen';
      setError(message);
      onError?.(message);
    } finally {
      setIsSubmitting(false);
    }
  }, [formKey, email, answers, isSubmitting, onSubmitSuccess, onError]);

  // Check if all required fields are answered
  const isValid = form?.sections.every((section) =>
    section.fields.every((field) => {
      if (!field.is_required) return true;
      const val = answers[field.key];
      return val !== undefined && val !== null && val !== '';
    })
  ) ?? false;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="py-8">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-cream/10 rounded w-1/3" />
                <div className="h-8 bg-cream/10 rounded w-full" />
                <div className="h-8 bg-cream/10 rounded w-2/3" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error && !form) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <p className="text-warm-red">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!form) return null;

  return (
    <div className="space-y-6">
      {form.sections.map((section, index) => (
        <DynamicSection
          key={section.id}
          section={section}
          answers={answers}
          onFieldChange={handleFieldChange}
          disabled={isSubmitted}
          participants={participants}
          animationDelay={index * 0.1}
        />
      ))}

      {renderFooter?.({
        isValid: isValid && !isSubmitted,
        isLoading: isSubmitting,
        onSubmit: handleSubmit,
      })}
    </div>
  );
}

// --- Section sub-component ---

interface DynamicSectionProps {
  section: FormSectionWithFields;
  answers: Record<string, unknown>;
  onFieldChange: (fieldKey: string, value: unknown) => void;
  disabled: boolean;
  participants: Array<{ value: string; label: string }>;
  animationDelay: number;
}

function DynamicSection({
  section,
  answers,
  onFieldChange,
  disabled,
  participants,
  animationDelay,
}: DynamicSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: animationDelay }}
    >
      <Card>
        <CardHeader>
          <CardTitle>
            {section.icon && `${section.icon} `}
            {section.label}
          </CardTitle>
          {section.description && (
            <CardDescription>{section.description}</CardDescription>
          )}
        </CardHeader>
        <CardContent className="space-y-8">
          {section.fields.map((field) => (
            <DynamicField
              key={field.id}
              field={field}
              value={answers[field.key]}
              onChange={(value) => onFieldChange(field.key, value)}
              disabled={disabled}
              participants={participants}
            />
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}
