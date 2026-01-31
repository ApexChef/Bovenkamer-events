'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/AuthGuard';
import type { FormStructure, FormSectionWithFields, FormField, BooleanOptions, SliderOptions, TimeOptions } from '@/types';

interface FormResponseRow {
  form_key: string;
  user_name: string;
  user_email: string;
  status: string;
  submitted_at: string;
  section_key: string;
  section_label: string;
  section_sort: number;
  field_key: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  field_sort: number;
  text: string | null;
  number: number | null;
  boolean: boolean | null;
  participant_id: string | null;
  display_value: string;
}

interface UserResponse {
  name: string;
  email: string;
  status: string;
  submitted_at: string;
  fields: FormResponseRow[];
}

interface FormApiResponse {
  form_key: string;
  total_responses: number;
  responses: UserResponse[];
  raw: FormResponseRow[];
}

interface Participant {
  value: string;
  label: string;
}

/** Derive unique field columns from raw response data, preserving section/field sort order. */
function getFieldColumns(raw: FormResponseRow[]): { key: string; label: string; fieldType: string }[] {
  const seen = new Map<string, { label: string; fieldType: string; sectionSort: number; fieldSort: number }>();
  for (const row of raw) {
    if (!seen.has(row.field_key)) {
      seen.set(row.field_key, {
        label: row.field_label,
        fieldType: row.field_type,
        sectionSort: row.section_sort,
        fieldSort: row.field_sort,
      });
    }
  }
  return Array.from(seen.entries())
    .sort(([, a], [, b]) => a.sectionSort - b.sectionSort || a.fieldSort - b.fieldSort)
    .map(([key, v]) => ({ key, label: v.label, fieldType: v.fieldType }));
}

/** Generate time options from a time field's options (minHour/maxHour). */
function generateTimeOptions(opts: TimeOptions): { value: number; label: string }[] {
  const minH = opts.minHour;
  const maxH = opts.maxHour;
  // Time wraps around midnight: e.g. 19:00 -> 06:00
  // Generate half-hour slots as slider values 0, 1, 2, ...
  const items: { value: number; label: string }[] = [];
  let hour = minH;
  let idx = 0;
  const limit = 48; // safety limit
  while (idx < limit) {
    const h = hour % 24;
    items.push({ value: idx, label: `${h.toString().padStart(2, '0')}:00` });
    items.push({ value: idx + 1, label: `${h.toString().padStart(2, '0')}:30` });
    idx += 2;
    hour++;
    // Stop after we've passed maxHour (handling wrap-around)
    if (maxH > minH) {
      if (hour > maxH) break;
    } else {
      // Wraps past midnight, e.g. 19 -> 6
      if (hour >= 24 + maxH + 1) break;
    }
  }
  return items;
}

export default function AdminPredictionsPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <AdminPredictionsContent />
    </AuthGuard>
  );
}

function AdminPredictionsContent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'results' | 'live' | 'scores'>('overview');
  const [formData, setFormData] = useState<FormApiResponse | null>(null);
  const [formStructure, setFormStructure] = useState<FormStructure | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [actualResults, setActualResults] = useState<Record<string, unknown>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isGeneratingEvaluations, setIsGeneratingEvaluations] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [formRes, structureRes, participantsRes, resultsRes] = await Promise.all([
          fetch('/api/admin/forms/predictions/responses'),
          fetch('/api/forms/predictions'),
          fetch('/api/participants'),
          fetch('/api/admin/predictions/results'),
        ]);

        if (formRes.ok) {
          setFormData(await formRes.json());
        }

        if (structureRes.ok) {
          setFormStructure(await structureRes.json());
        }

        if (participantsRes.ok) {
          setParticipants(await participantsRes.json());
        }

        if (resultsRes.ok) {
          const data = await resultsRes.json();
          setActualResults(data.results || {});
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Save actual results
  const handleSaveResults = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/predictions/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: actualResults }),
      });

      if (!response.ok) throw new Error('Kon resultaten niet opslaan');

      setLastSaved(new Date());
      setMessage({ type: 'success', text: 'Resultaten opgeslagen! Leaderboard wordt automatisch bijgewerkt.' });
    } catch (error) {
      console.error('Error saving results:', error);
      setMessage({ type: 'error', text: 'Kon resultaten niet opslaan' });
    } finally {
      setIsSaving(false);
    }
  };

  // Quick save for live mode (auto-saves on change)
  const handleQuickSave = useCallback(async (newResults: Record<string, unknown>) => {
    setActualResults(newResults);
    setIsSaving(true);

    try {
      const response = await fetch('/api/admin/predictions/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: newResults }),
      });

      if (response.ok) {
        setLastSaved(new Date());
      }
    } catch (error) {
      console.error('Error quick saving:', error);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // Calculate and award points
  const handleCalculatePoints = async () => {
    setIsCalculating(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/predictions/calculate', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Kon punten niet berekenen');

      setMessage({ type: 'success', text: `Punten berekend! ${data.usersProcessed} gebruikers verwerkt.` });
    } catch (error) {
      console.error('Error calculating points:', error);
      setMessage({ type: 'error', text: 'Kon punten niet berekenen' });
    } finally {
      setIsCalculating(false);
    }
  };

  // Generate AI evaluations for all users
  const handleGenerateEvaluations = async () => {
    setIsGeneratingEvaluations(true);
    setEvaluationProgress('Evaluaties genereren...');
    setMessage(null);

    try {
      const response = await fetch('/api/admin/predictions/evaluate', {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Kon evaluaties niet genereren');

      setEvaluationProgress(null);
      setMessage({
        type: 'success',
        text: `${data.generated} evaluaties gegenereerd${data.failed > 0 ? ` (${data.failed} mislukt)` : ''}`,
      });
    } catch (error) {
      console.error('Error generating evaluations:', error);
      setEvaluationProgress(null);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Kon evaluaties niet genereren' });
    } finally {
      setIsGeneratingEvaluations(false);
    }
  };

  // Update a single result value
  const updateResult = useCallback((key: string, value: unknown) => {
    setActualResults((prev) => {
      const next = { ...prev };
      if (value === undefined || value === '') {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
  }, []);

  // Update a single result value with auto-save (for live mode)
  const updateResultLive = useCallback((key: string, value: unknown) => {
    setActualResults((prev) => {
      const next = { ...prev };
      if (value === undefined || value === '') {
        delete next[key];
      } else {
        next[key] = value;
      }
      handleQuickSave(next);
      return next;
    });
  }, [handleQuickSave]);

  // Derive field columns and stats from form response data
  const fieldColumns = formData ? getFieldColumns(formData.raw) : [];
  const participantMap = new Map(participants.map((p) => [p.value, p.label]));

  // All active fields from the form structure (for Results/Live tabs)
  const allFields: { section: FormSectionWithFields; field: FormField }[] = [];
  if (formStructure) {
    for (const section of formStructure.sections) {
      for (const field of section.fields) {
        allFields.push({ section, field });
      }
    }
  }

  // Count non-undefined results for fields that exist in the form
  const resultKeys = new Set(allFields.map((f) => f.field.key));
  const resultsEnteredCount = Object.keys(actualResults).filter(
    (k) => resultKeys.has(k) && actualResults[k] !== undefined && actualResults[k] !== null,
  ).length;

  const stats = {
    total: formData?.total_responses ?? 0,
    withPredictions: formData?.responses.filter((r) => r.fields.length > 0).length ?? 0,
    resultsEntered: resultsEnteredCount,
    totalFields: allFields.length,
  };

  /** Format a display value based on field type */
  const formatFieldValue = (row: FormResponseRow | undefined): string => {
    if (!row) return '-';
    if (row.field_type === 'boolean') {
      if (row.boolean === true) return 'Ja';
      if (row.boolean === false) return 'Nee';
      return '-';
    }
    if (row.field_type === 'select_participant') {
      return row.participant_id ? (participantMap.get(row.participant_id) || row.participant_id) : '-';
    }
    if (row.field_type === 'slider') {
      return row.number != null ? String(row.number) : '-';
    }
    if (row.field_type === 'time') {
      return row.number != null ? String(row.number) : '-';
    }
    return row.display_value || '-';
  };

  /** Check if a result value is filled in */
  const isResultFilled = (key: string): boolean => {
    const val = actualResults[key];
    return val !== undefined && val !== null && val !== '';
  };

  // Group fields by section for rendering
  const sectionGroups: { section: FormSectionWithFields; fields: FormField[] }[] = [];
  if (formStructure) {
    for (const section of formStructure.sections) {
      if (section.fields.length > 0) {
        sectionGroups.push({ section, fields: section.fields });
      }
    }
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gold mb-2">
              Voorspellingen
            </h1>
            <p className="text-cream/60">Bekijk voorspellingen en vul de uitkomsten in</p>
          </div>
          <Link href="/admin">
            <Button variant="ghost">&larr; Terug</Button>
          </Link>
        </div>

        {/* Message */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-success-green/20 text-success-green' : 'bg-warm-red/20 text-warm-red'
            }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Button
            variant={activeTab === 'overview' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('overview')}
          >
            Overzicht
          </Button>
          <Button
            variant={activeTab === 'results' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('results')}
          >
            Uitkomsten
          </Button>
          <Button
            variant={activeTab === 'live' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('live')}
          >
            🔴 Live Mode
          </Button>
          <Button
            variant={activeTab === 'scores' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('scores')}
          >
            Punten
          </Button>
          <Link href="/leaderboard/live" target="_blank" className="ml-auto">
            <Button variant="ghost">
              🏆 Open Leaderboard →
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cream/60">Laden...</p>
          </div>
        ) : activeTab === 'overview' ? (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-3xl font-bold text-gold">{stats.total}</p>
                    <p className="text-cream/60 text-sm">Deelnemers</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-3xl font-bold text-success-green">{stats.withPredictions}</p>
                    <p className="text-cream/60 text-sm">Voorspellingen</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-3xl font-bold text-yellow-500">{stats.total - stats.withPredictions}</p>
                    <p className="text-cream/60 text-sm">Nog niet gedaan</p>
                  </CardContent>
                </Card>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                <Card>
                  <CardContent className="py-4 text-center">
                    <p className="text-3xl font-bold text-gold">{stats.resultsEntered}/{stats.totalFields}</p>
                    <p className="text-cream/60 text-sm">Uitkomsten ingevuld</p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Predictions List */}
            <Card>
              <CardHeader>
                <CardTitle>Alle Voorspellingen</CardTitle>
                <CardDescription>Overzicht van alle ingediende voorspellingen</CardDescription>
              </CardHeader>
              <CardContent>
                {!formData || formData.total_responses === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-cream/60 mb-2">Nog geen voorspellingen</p>
                    <p className="text-cream/40 text-sm">
                      Voorspellingen verschijnen hier zodra mensen ze indienen.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gold/20">
                          <th className="text-left py-3 px-2 text-gold font-semibold">Naam</th>
                          {fieldColumns.map((col) => (
                            <th key={col.key} className="text-center py-3 px-2 text-gold/70 font-normal text-xs">
                              {col.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {formData.responses.map((user, index) => {
                          const fieldMap = new Map(user.fields.map((f) => [f.field_key, f]));
                          return (
                            <motion.tr
                              key={user.email}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: index * 0.03 }}
                              className="border-b border-gold/10 hover:bg-dark-wood/30"
                            >
                              <td className="py-3 px-2 text-cream font-medium">{user.name}</td>
                              {fieldColumns.map((col) => (
                                <td key={col.key} className="text-center py-3 px-2 text-cream/70 text-xs">
                                  {formatFieldValue(fieldMap.get(col.key))}
                                </td>
                              ))}
                            </motion.tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : activeTab === 'results' ? (
          /* Results Tab - Dynamic */
          <Card>
            <CardHeader>
              <CardTitle>Werkelijke Uitkomsten</CardTitle>
              <CardDescription>Vul hier de daadwerkelijke resultaten in na het event</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {sectionGroups.map((group, groupIdx) => (
                  <div key={group.section.key} className={groupIdx < sectionGroups.length - 1 ? 'border-b border-gold/10 pb-6' : 'pb-6'}>
                    <h3 className="text-gold font-semibold mb-4">{group.section.label}</h3>
                    <div className={`grid grid-cols-1 ${group.fields.length <= 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                      {group.fields.map((field) => (
                        <ResultFieldInput
                          key={field.key}
                          field={field}
                          value={actualResults[field.key]}
                          onChange={(value) => updateResult(field.key, value)}
                          participants={participants}
                        />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Save Button */}
                <div className="pt-4 border-t border-gold/10">
                  <Button onClick={handleSaveResults} disabled={isSaving}>
                    {isSaving ? 'Opslaan...' : 'Uitkomsten Opslaan'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : activeTab === 'live' ? (
          /* Live Mode Tab - Dynamic */
          <div className="space-y-6">
            {/* Live Mode Header */}
            <Card className="bg-gradient-to-r from-warm-red/20 to-gold/20 border-warm-red/50">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-warm-red opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-warm-red"></span>
                    </span>
                    <span className="text-gold font-semibold">LIVE MODE</span>
                    {isSaving && <span className="text-cream/60 text-sm">Opslaan...</span>}
                  </div>
                  <div className="text-right text-sm">
                    {lastSaved && (
                      <p className="text-cream/60">
                        Laatst opgeslagen: {lastSaved.toLocaleTimeString('nl-NL')}
                      </p>
                    )}
                    <p className="text-gold">{stats.resultsEntered}/{stats.totalFields} ingevuld</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dynamic Cards grouped by section */}
            {sectionGroups.map((group) => (
              <div key={group.section.key}>
                <h3 className="text-gold font-semibold mb-3 text-sm uppercase tracking-wider">
                  {group.section.label}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  {group.fields.map((field) => (
                    <LiveFieldCard
                      key={field.key}
                      field={field}
                      value={actualResults[field.key]}
                      isFilled={isResultFilled(field.key)}
                      onChange={(value) => updateResultLive(field.key, value)}
                      participants={participants}
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Quick Actions */}
            <Card>
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="text-cream/60 text-sm">
                    Wijzigingen worden automatisch opgeslagen en zijn direct zichtbaar op het leaderboard.
                  </div>
                  <Link href="/leaderboard/live" target="_blank">
                    <Button>🏆 Bekijk Leaderboard</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Scores Tab */
          <Card>
            <CardHeader>
              <CardTitle>Punten Berekenen</CardTitle>
              <CardDescription>Bereken en ken punten toe op basis van de voorspellingen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Info */}
                <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
                  <h4 className="text-gold font-semibold mb-2">Puntentoekenning</h4>
                  <ul className="text-sm text-cream/70 space-y-1">
                    <li>Exact goed: <span className="text-gold">+50 punten</span></li>
                    <li>Dichtbij (±10% voor getallen): <span className="text-gold">+25 punten</span></li>
                    <li>Goede richting (±25%): <span className="text-gold">+10 punten</span></li>
                  </ul>
                </div>

                {/* Status */}
                <div className="border border-gold/20 rounded-lg p-4">
                  <h4 className="text-cream font-semibold mb-2">Status</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-cream/60">Uitkomsten ingevuld:</span>
                      <span className={`ml-2 ${stats.resultsEntered === stats.totalFields ? 'text-success-green' : 'text-yellow-500'}`}>
                        {stats.resultsEntered}/{stats.totalFields}
                      </span>
                    </div>
                    <div>
                      <span className="text-cream/60">Voorspellingen:</span>
                      <span className="ml-2 text-cream">{stats.withPredictions}</span>
                    </div>
                  </div>
                </div>

                {/* Warning */}
                {stats.resultsEntered < stats.totalFields && (
                  <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-yellow-500 text-sm">
                      Nog niet alle uitkomsten zijn ingevuld. Vul eerst alle uitkomsten in op het &quot;Uitkomsten&quot; tabblad voordat je punten berekent.
                    </p>
                  </div>
                )}

                {/* Calculate Button */}
                <div className="pt-4 border-t border-gold/10 space-y-4">
                  <div>
                    <Button
                      onClick={handleCalculatePoints}
                      disabled={isCalculating || stats.resultsEntered === 0}
                    >
                      {isCalculating ? 'Berekenen...' : 'Punten Berekenen en Toekennen'}
                    </Button>
                    <p className="text-cream/50 text-xs mt-2">
                      Dit berekent de punten voor alle voorspellingen en slaat ze op in het puntenboek.
                    </p>
                  </div>

                  {/* Generate Evaluations Button */}
                  <div className="pt-4 border-t border-gold/10">
                    <Button
                      onClick={handleGenerateEvaluations}
                      disabled={isGeneratingEvaluations || stats.resultsEntered === 0}
                      variant="ghost"
                    >
                      {isGeneratingEvaluations
                        ? (evaluationProgress || 'Genereren...')
                        : 'Genereer Evaluaties'}
                    </Button>
                    <p className="text-cream/50 text-xs mt-2">
                      Genereer per persoon een AI-evaluatie op basis van hun voorspellingen.
                      Punten moeten eerst berekend zijn.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Dynamic field input for Results tab
// ---------------------------------------------------------------------------

function ResultFieldInput({
  field,
  value,
  onChange,
  participants,
}: {
  field: FormField;
  value: unknown;
  onChange: (value: unknown) => void;
  participants: Participant[];
}) {
  const inputClass = 'w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none';

  switch (field.field_type) {
    case 'slider':
    case 'star_rating': {
      const opts = field.options as SliderOptions;
      return (
        <div>
          <label className="block text-cream/70 text-sm mb-2">{field.label}</label>
          <input
            type="number"
            min={opts.min}
            max={opts.max}
            step={opts.unit?.includes('kg') ? 0.1 : 1}
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={(e) => {
              const v = e.target.value;
              onChange(v === '' ? undefined : parseFloat(v));
            }}
            className={inputClass}
            placeholder={opts.unit ? `${opts.min}–${opts.max}${opts.unit}` : 'Aantal'}
          />
        </div>
      );
    }
    case 'select_participant':
      return (
        <div>
          <label className="block text-cream/70 text-sm mb-2">{field.label}</label>
          <select
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || undefined)}
            className={inputClass}
          >
            <option value="">Selecteer...</option>
            {participants.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      );
    case 'boolean': {
      const boolOpts = field.options as BooleanOptions;
      return (
        <div>
          <label className="block text-cream/70 text-sm mb-2">{field.label}</label>
          <select
            value={value === undefined || value === null ? '' : String(value)}
            onChange={(e) => onChange(e.target.value === '' ? undefined : e.target.value === 'true')}
            className={inputClass}
          >
            <option value="">Selecteer...</option>
            <option value="true">{boolOpts.trueLabel || 'Ja'}</option>
            <option value="false">{boolOpts.falseLabel || 'Nee'}</option>
          </select>
        </div>
      );
    }
    case 'time': {
      const timeOpts = field.options as TimeOptions;
      const timeOptions = generateTimeOptions(timeOpts);
      return (
        <div>
          <label className="block text-cream/70 text-sm mb-2">{field.label}</label>
          <select
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={(e) => onChange(e.target.value === '' ? undefined : parseInt(e.target.value))}
            className={inputClass}
          >
            <option value="">Selecteer...</option>
            {timeOptions.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      );
    }
    default:
      return (
        <div>
          <label className="block text-cream/70 text-sm mb-2">{field.label}</label>
          <input
            type="text"
            value={(value as string) ?? ''}
            onChange={(e) => onChange(e.target.value || undefined)}
            className={inputClass}
          />
        </div>
      );
  }
}

// ---------------------------------------------------------------------------
// Dynamic field card for Live Mode tab
// ---------------------------------------------------------------------------

function LiveFieldCard({
  field,
  value,
  isFilled,
  onChange,
  participants,
}: {
  field: FormField;
  value: unknown;
  isFilled: boolean;
  onChange: (value: unknown) => void;
  participants: Participant[];
}) {
  const liveInputClass = 'w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-3 text-cream text-2xl text-center focus:border-gold focus:outline-none';
  const liveSelectClass = 'w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-3 text-cream focus:border-gold focus:outline-none';

  switch (field.field_type) {
    case 'slider':
    case 'star_rating': {
      const opts = field.options as SliderOptions;
      return (
        <motion.div whileTap={{ scale: 0.98 }}>
          <Card className={isFilled ? 'border-success-green/50' : ''}>
            <CardContent className="py-4">
              <label className="block text-gold font-semibold mb-2">{field.label}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={opts.min}
                  max={opts.max}
                  step={opts.unit?.includes('kg') ? 0.1 : 1}
                  value={value !== undefined && value !== null ? String(value) : ''}
                  onChange={(e) => {
                    const v = e.target.value;
                    onChange(v === '' ? undefined : parseFloat(v));
                  }}
                  className={liveInputClass}
                  placeholder="?"
                />
                {opts.unit && <span className="text-cream text-xl">{opts.unit.trim()}</span>}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }
    case 'select_participant':
      return (
        <motion.div whileTap={{ scale: 0.98 }}>
          <Card className={isFilled ? 'border-success-green/50' : ''}>
            <CardContent className="py-4">
              <label className="block text-gold font-semibold mb-2">{field.label}</label>
              <select
                value={(value as string) ?? ''}
                onChange={(e) => onChange(e.target.value || undefined)}
                className={liveSelectClass}
              >
                <option value="">Nog niet bekend...</option>
                {participants.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </CardContent>
          </Card>
        </motion.div>
      );
    case 'boolean': {
      const boolOpts = field.options as BooleanOptions;
      const trueLabel = boolOpts.trueLabel || 'Ja';
      const falseLabel = boolOpts.falseLabel || 'Nee';
      const trueEmoji = boolOpts.trueEmoji || '';
      const falseEmoji = boolOpts.falseEmoji || '✓';
      return (
        <motion.div whileTap={{ scale: 0.98 }}>
          <Card className={isFilled ? 'border-success-green/50' : ''}>
            <CardContent className="py-4">
              <label className="block text-gold font-semibold mb-2">{field.label}</label>
              <div className="flex gap-2">
                <button
                  onClick={() => onChange(true)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    value === true
                      ? 'bg-warm-red text-cream'
                      : 'bg-dark-wood/50 text-cream/60 hover:bg-dark-wood'
                  }`}
                >
                  {trueLabel} {trueEmoji}
                </button>
                <button
                  onClick={() => onChange(false)}
                  className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                    value === false
                      ? 'bg-success-green text-cream'
                      : 'bg-dark-wood/50 text-cream/60 hover:bg-dark-wood'
                  }`}
                >
                  {falseLabel} {falseEmoji}
                </button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      );
    }
    case 'time': {
      const timeOpts = field.options as TimeOptions;
      const timeOptions = generateTimeOptions(timeOpts);
      return (
        <motion.div whileTap={{ scale: 0.98 }}>
          <Card className={isFilled ? 'border-success-green/50' : ''}>
            <CardContent className="py-4">
              <label className="block text-gold font-semibold mb-2">{field.label}</label>
              <select
                value={value !== undefined && value !== null ? String(value) : ''}
                onChange={(e) => onChange(e.target.value === '' ? undefined : parseInt(e.target.value))}
                className={liveSelectClass}
              >
                <option value="">Nog niet bekend...</option>
                {timeOptions.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </CardContent>
          </Card>
        </motion.div>
      );
    }
    default:
      return (
        <motion.div whileTap={{ scale: 0.98 }}>
          <Card className={isFilled ? 'border-success-green/50' : ''}>
            <CardContent className="py-4">
              <label className="block text-gold font-semibold mb-2">{field.label}</label>
              <input
                type="text"
                value={(value as string) ?? ''}
                onChange={(e) => onChange(e.target.value || undefined)}
                className={liveInputClass}
                placeholder="?"
              />
            </CardContent>
          </Card>
        </motion.div>
      );
  }
}
