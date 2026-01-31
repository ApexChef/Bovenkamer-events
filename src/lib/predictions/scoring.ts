/**
 * Shared prediction scoring logic.
 *
 * Centralises field-fetching and score calculation so the admin calculate,
 * evaluate, and live-leaderboard routes all use the same logic.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { FormFieldType } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScoringField {
  key: string;
  label: string;
  fieldType: FormFieldType;
  options: Record<string, unknown>;
  sectionKey: string;
  sectionLabel: string;
  sectionSort: number;
  fieldSort: number;
}

export interface ScoreResult {
  total: number;
  breakdown: Record<string, number>;
}

// ---------------------------------------------------------------------------
// Fetch active prediction fields from the form system
// ---------------------------------------------------------------------------

export async function fetchPredictionFields(
  supabase: SupabaseClient,
): Promise<ScoringField[]> {
  // Get the predictions form definition
  const { data: definition } = await supabase
    .from('form_definition')
    .select('active_version_id')
    .eq('key', 'predictions')
    .single();

  if (!definition?.active_version_id) return [];

  // Get active sections for this version
  const { data: sections } = await supabase
    .from('form_section')
    .select('id, key, label, sort_order')
    .eq('form_version_id', definition.active_version_id)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (!sections || sections.length === 0) return [];

  const sectionIds = sections.map((s) => s.id);

  // Get all active fields for those sections
  const { data: fields } = await supabase
    .from('form_field')
    .select('key, label, field_type, options, form_section_id, sort_order')
    .in('form_section_id', sectionIds)
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (!fields) return [];

  const sectionMap = new Map(
    sections.map((s) => [s.id, { key: s.key, label: s.label, sort: s.sort_order }]),
  );

  return fields.map((f) => {
    const sec = sectionMap.get(f.form_section_id)!;
    return {
      key: f.key,
      label: f.label,
      fieldType: f.field_type as FormFieldType,
      options: (f.options ?? {}) as Record<string, unknown>,
      sectionKey: sec.key,
      sectionLabel: sec.label,
      sectionSort: sec.sort,
      fieldSort: f.sort_order,
    };
  }).sort((a, b) => a.sectionSort - b.sectionSort || a.fieldSort - b.fieldSort);
}

// ---------------------------------------------------------------------------
// Fetch user predictions from the form_field_response system
// ---------------------------------------------------------------------------

export interface UserPrediction {
  userId: string;
  userName: string;
  answers: Record<string, unknown>;
}

/**
 * Fetch all submitted predictions from the dynamic form system.
 * Returns a flat map of field_key -> value per user.
 */
export async function fetchUserPredictions(
  supabase: SupabaseClient,
): Promise<UserPrediction[]> {
  const { data, error } = await supabase
    .from('v_form_responses')
    .select('user_id, user_name, field_key, field_type, text, number, boolean, participant_id, json')
    .eq('form_key', 'predictions')
    .order('user_name');

  if (error || !data) return [];

  // Group by user
  const byUser = new Map<string, { name: string; answers: Record<string, unknown> }>();

  for (const row of data) {
    let entry = byUser.get(row.user_id);
    if (!entry) {
      entry = { name: row.user_name, answers: {} };
      byUser.set(row.user_id, entry);
    }

    // Extract the typed value based on field_type
    const value = extractValue(row);
    if (value !== undefined) {
      entry.answers[row.field_key] = value;
    }
  }

  return Array.from(byUser.entries()).map(([userId, data]) => ({
    userId,
    userName: data.name,
    answers: data.answers,
  }));
}

function extractValue(row: {
  field_type: string;
  text: string | null;
  number: number | null;
  boolean: boolean | null;
  participant_id: string | null;
  json: unknown;
}): unknown {
  switch (row.field_type) {
    case 'slider':
    case 'star_rating':
    case 'time':
      return row.number ?? undefined;
    case 'select_participant':
      return row.participant_id ?? undefined;
    case 'boolean':
      return row.boolean ?? undefined;
    case 'select_options':
    case 'radio_group':
      return row.text ?? undefined;
    case 'checkbox_group':
      return row.json ?? undefined;
    case 'text_short':
    case 'text_long':
      return row.text ?? undefined;
    default:
      return row.text ?? row.number ?? row.boolean ?? row.participant_id ?? undefined;
  }
}

// ---------------------------------------------------------------------------
// Score calculation
// ---------------------------------------------------------------------------

/**
 * Calculate the prediction score for a single user.
 *
 * Scoring rules per field_type:
 * - slider, star_rating  : numeric proximity (exact=50, ±10%=25, ±25%=10)
 * - select_participant, boolean, select_options, radio_group : exact match (50 or 0)
 * - time                 : proximity in slider units (exact=50, ±1=25, ±2=10)
 * - text_short, text_long, checkbox_group : not scored
 */
export function calculatePredictionScore(
  fields: ScoringField[],
  userPredictions: Record<string, unknown>,
  actualResults: Record<string, unknown>,
): ScoreResult {
  let total = 0;
  const breakdown: Record<string, number> = {};

  for (const field of fields) {
    const predicted = userPredictions[field.key];
    const actual = actualResults[field.key];

    // Skip if either side is missing
    if (predicted === undefined || predicted === null || actual === undefined || actual === null) {
      continue;
    }

    let points = 0;

    switch (field.fieldType) {
      case 'slider':
      case 'star_rating':
        points = scoreNumeric(predicted as number, actual as number);
        break;
      case 'time':
        points = scoreTime(predicted as number, actual as number);
        break;
      case 'select_participant':
      case 'boolean':
      case 'select_options':
      case 'radio_group':
        points = scoreExact(predicted, actual);
        break;
      // text_short, text_long, checkbox_group are not scored
      default:
        continue;
    }

    breakdown[field.key] = points;
    total += points;
  }

  return { total, breakdown };
}

function scoreNumeric(predicted: number, actual: number): number {
  const diff = Math.abs(predicted - actual);
  const percentDiff = actual !== 0 ? (diff / Math.abs(actual)) * 100 : (diff === 0 ? 0 : 100);

  if (diff === 0) return 50;
  if (percentDiff <= 10) return 25;
  if (percentDiff <= 25) return 10;
  return 0;
}

function scoreTime(predicted: number, actual: number): number {
  const diff = Math.abs(predicted - actual);
  if (diff === 0) return 50;
  if (diff <= 1) return 25;
  if (diff <= 2) return 10;
  return 0;
}

function scoreExact(predicted: unknown, actual: unknown): number {
  return predicted === actual ? 50 : 0;
}

/**
 * Return the list of field types that are scorable.
 */
export function isScorable(fieldType: FormFieldType): boolean {
  return ['slider', 'star_rating', 'time', 'select_participant', 'boolean', 'select_options', 'radio_group'].includes(fieldType);
}

/**
 * Count scorable fields and derive max points.
 */
export function getMaxPoints(fields: ScoringField[]): number {
  return fields.filter((f) => isScorable(f.fieldType)).length * 50;
}
