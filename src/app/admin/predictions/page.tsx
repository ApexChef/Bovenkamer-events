'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/AuthGuard';

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

interface ActualResults {
  wineBottles?: number;
  beerCrates?: number;
  meatKilos?: number;
  firstSleeper?: string;
  spontaneousSinger?: string;
  lastToLeave?: string;
  loudestLaugher?: string;
  longestStoryTeller?: string;
  somethingBurned?: boolean;
  outsideTemp?: number;
  lastGuestTime?: string;
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

const TIME_OPTIONS = Array.from({ length: 15 }, (_, i) => {
  const hour = 20 + Math.floor(i / 2);
  const minutes = (i % 2) * 30;
  const time = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  return { value: time, label: time };
});

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
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [actualResults, setActualResults] = useState<ActualResults>({});
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
        const [formRes, participantsRes, resultsRes] = await Promise.all([
          fetch('/api/admin/forms/predictions/responses'),
          fetch('/api/participants'),
          fetch('/api/admin/predictions/results'),
        ]);

        if (formRes.ok) {
          setFormData(await formRes.json());
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
  const handleQuickSave = async (newResults: ActualResults) => {
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
  };

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

  // Derive field columns and stats from form response data
  const fieldColumns = formData ? getFieldColumns(formData.raw) : [];
  const participantMap = new Map(participants.map((p) => [p.value, p.label]));

  const stats = {
    total: formData?.total_responses ?? 0,
    withPredictions: formData?.responses.filter((r) => r.fields.length > 0).length ?? 0,
    resultsEntered: Object.keys(actualResults).length,
    totalFields: fieldColumns.length,
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
          /* Results Tab */
          <Card>
            <CardHeader>
              <CardTitle>Werkelijke Uitkomsten</CardTitle>
              <CardDescription>Vul hier de daadwerkelijke resultaten in na het event</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Consumption */}
                <div className="border-b border-gold/10 pb-6">
                  <h3 className="text-gold font-semibold mb-4">Consumptie</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Flessen wijn</label>
                      <input
                        type="number"
                        min="0"
                        value={actualResults.wineBottles ?? ''}
                        onChange={(e) => setActualResults({ ...actualResults, wineBottles: parseInt(e.target.value) || undefined })}
                        className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none"
                        placeholder="Aantal"
                      />
                    </div>
                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Kratten bier</label>
                      <input
                        type="number"
                        min="0"
                        value={actualResults.beerCrates ?? ''}
                        onChange={(e) => setActualResults({ ...actualResults, beerCrates: parseInt(e.target.value) || undefined })}
                        className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none"
                        placeholder="Aantal"
                      />
                    </div>
                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Kilo&apos;s vlees</label>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={actualResults.meatKilos ?? ''}
                        onChange={(e) => setActualResults({ ...actualResults, meatKilos: parseFloat(e.target.value) || undefined })}
                        className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none"
                        placeholder="Kg"
                      />
                    </div>
                  </div>
                </div>

                {/* Social */}
                <div className="border-b border-gold/10 pb-6">
                  <h3 className="text-gold font-semibold mb-4">Sociale Voorspellingen</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Wie viel als eerste in slaap?</label>
                      <select
                        value={actualResults.firstSleeper ?? ''}
                        onChange={(e) => setActualResults({ ...actualResults, firstSleeper: e.target.value || undefined })}
                        className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none"
                      >
                        <option value="">Selecteer...</option>
                        {participants.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Wie begon spontaan te zingen?</label>
                      <select
                        value={actualResults.spontaneousSinger ?? ''}
                        onChange={(e) => setActualResults({ ...actualResults, spontaneousSinger: e.target.value || undefined })}
                        className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none"
                      >
                        <option value="">Selecteer...</option>
                        {participants.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Wie ging als laatste naar huis?</label>
                      <select
                        value={actualResults.lastToLeave ?? ''}
                        onChange={(e) => setActualResults({ ...actualResults, lastToLeave: e.target.value || undefined })}
                        className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none"
                      >
                        <option value="">Selecteer...</option>
                        {participants.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Wie was de luidste lacher?</label>
                      <select
                        value={actualResults.loudestLaugher ?? ''}
                        onChange={(e) => setActualResults({ ...actualResults, loudestLaugher: e.target.value || undefined })}
                        className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none"
                      >
                        <option value="">Selecteer...</option>
                        {participants.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Wie vertelde het langste verhaal?</label>
                      <select
                        value={actualResults.longestStoryTeller ?? ''}
                        onChange={(e) => setActualResults({ ...actualResults, longestStoryTeller: e.target.value || undefined })}
                        className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none"
                      >
                        <option value="">Selecteer...</option>
                        {participants.map((p) => (
                          <option key={p.value} value={p.value}>{p.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Other */}
                <div className="pb-6">
                  <h3 className="text-gold font-semibold mb-4">Overige Uitkomsten</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Werd er iets aangebrand?</label>
                      <select
                        value={actualResults.somethingBurned === undefined ? '' : actualResults.somethingBurned.toString()}
                        onChange={(e) => setActualResults({ ...actualResults, somethingBurned: e.target.value === '' ? undefined : e.target.value === 'true' })}
                        className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none"
                      >
                        <option value="">Selecteer...</option>
                        <option value="true">Ja</option>
                        <option value="false">Nee</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Buitentemperatuur (°C)</label>
                      <input
                        type="number"
                        min="-20"
                        max="20"
                        value={actualResults.outsideTemp ?? ''}
                        onChange={(e) => setActualResults({ ...actualResults, outsideTemp: parseInt(e.target.value) })}
                        className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none"
                        placeholder="Graden"
                      />
                    </div>
                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Hoe laat vertrok de laatste gast?</label>
                      <select
                        value={actualResults.lastGuestTime ?? ''}
                        onChange={(e) => setActualResults({ ...actualResults, lastGuestTime: e.target.value || undefined })}
                        className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none"
                      >
                        <option value="">Selecteer...</option>
                        {TIME_OPTIONS.map((t) => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

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
          /* Live Mode Tab - Quick updates during the event */
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

            {/* Quick Input Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Wine */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Card className={actualResults.wineBottles !== undefined ? 'border-success-green/50' : ''}>
                  <CardContent className="py-4">
                    <label className="block text-gold font-semibold mb-2">🍷 Flessen wijn</label>
                    <input
                      type="number"
                      min="0"
                      value={actualResults.wineBottles ?? ''}
                      onChange={(e) => handleQuickSave({ ...actualResults, wineBottles: parseInt(e.target.value) || undefined })}
                      className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-3 text-cream text-2xl text-center focus:border-gold focus:outline-none"
                      placeholder="?"
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Beer */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Card className={actualResults.beerCrates !== undefined ? 'border-success-green/50' : ''}>
                  <CardContent className="py-4">
                    <label className="block text-gold font-semibold mb-2">🍺 Kratten bier</label>
                    <input
                      type="number"
                      min="0"
                      value={actualResults.beerCrates ?? ''}
                      onChange={(e) => handleQuickSave({ ...actualResults, beerCrates: parseInt(e.target.value) || undefined })}
                      className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-3 text-cream text-2xl text-center focus:border-gold focus:outline-none"
                      placeholder="?"
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* Meat */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Card className={actualResults.meatKilos !== undefined ? 'border-success-green/50' : ''}>
                  <CardContent className="py-4">
                    <label className="block text-gold font-semibold mb-2">🥩 Kilo vlees</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={actualResults.meatKilos ?? ''}
                      onChange={(e) => handleQuickSave({ ...actualResults, meatKilos: parseFloat(e.target.value) || undefined })}
                      className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-3 text-cream text-2xl text-center focus:border-gold focus:outline-none"
                      placeholder="?"
                    />
                  </CardContent>
                </Card>
              </motion.div>

              {/* First Sleeper */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Card className={actualResults.firstSleeper ? 'border-success-green/50' : ''}>
                  <CardContent className="py-4">
                    <label className="block text-gold font-semibold mb-2">😴 Eerste slaper</label>
                    <select
                      value={actualResults.firstSleeper ?? ''}
                      onChange={(e) => handleQuickSave({ ...actualResults, firstSleeper: e.target.value || undefined })}
                      className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-3 text-cream focus:border-gold focus:outline-none"
                    >
                      <option value="">Nog niet bekend...</option>
                      {participants.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Spontaneous Singer */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Card className={actualResults.spontaneousSinger ? 'border-success-green/50' : ''}>
                  <CardContent className="py-4">
                    <label className="block text-gold font-semibold mb-2">🎤 Spontane zanger</label>
                    <select
                      value={actualResults.spontaneousSinger ?? ''}
                      onChange={(e) => handleQuickSave({ ...actualResults, spontaneousSinger: e.target.value || undefined })}
                      className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-3 text-cream focus:border-gold focus:outline-none"
                    >
                      <option value="">Nog niet bekend...</option>
                      {participants.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Loudest Laugher */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Card className={actualResults.loudestLaugher ? 'border-success-green/50' : ''}>
                  <CardContent className="py-4">
                    <label className="block text-gold font-semibold mb-2">😂 Luidste lacher</label>
                    <select
                      value={actualResults.loudestLaugher ?? ''}
                      onChange={(e) => handleQuickSave({ ...actualResults, loudestLaugher: e.target.value || undefined })}
                      className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-3 text-cream focus:border-gold focus:outline-none"
                    >
                      <option value="">Nog niet bekend...</option>
                      {participants.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Longest Story */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Card className={actualResults.longestStoryTeller ? 'border-success-green/50' : ''}>
                  <CardContent className="py-4">
                    <label className="block text-gold font-semibold mb-2">📖 Langste verhaal</label>
                    <select
                      value={actualResults.longestStoryTeller ?? ''}
                      onChange={(e) => handleQuickSave({ ...actualResults, longestStoryTeller: e.target.value || undefined })}
                      className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-3 text-cream focus:border-gold focus:outline-none"
                    >
                      <option value="">Nog niet bekend...</option>
                      {participants.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Something Burned */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Card className={actualResults.somethingBurned !== undefined ? 'border-success-green/50' : ''}>
                  <CardContent className="py-4">
                    <label className="block text-gold font-semibold mb-2">🔥 Iets aangebrand?</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleQuickSave({ ...actualResults, somethingBurned: true })}
                        className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                          actualResults.somethingBurned === true
                            ? 'bg-warm-red text-cream'
                            : 'bg-dark-wood/50 text-cream/60 hover:bg-dark-wood'
                        }`}
                      >
                        Ja 🔥
                      </button>
                      <button
                        onClick={() => handleQuickSave({ ...actualResults, somethingBurned: false })}
                        className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                          actualResults.somethingBurned === false
                            ? 'bg-success-green text-cream'
                            : 'bg-dark-wood/50 text-cream/60 hover:bg-dark-wood'
                        }`}
                      >
                        Nee ✓
                      </button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Temperature */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Card className={actualResults.outsideTemp !== undefined ? 'border-success-green/50' : ''}>
                  <CardContent className="py-4">
                    <label className="block text-gold font-semibold mb-2">🌡️ Buitentemperatuur</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="-20"
                        max="20"
                        value={actualResults.outsideTemp ?? ''}
                        onChange={(e) => handleQuickSave({ ...actualResults, outsideTemp: parseInt(e.target.value) })}
                        className="flex-1 bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-3 text-cream text-2xl text-center focus:border-gold focus:outline-none"
                        placeholder="?"
                      />
                      <span className="text-cream text-xl">°C</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Last to Leave */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Card className={actualResults.lastToLeave ? 'border-success-green/50' : ''}>
                  <CardContent className="py-4">
                    <label className="block text-gold font-semibold mb-2">🚪 Laatste vertrekker</label>
                    <select
                      value={actualResults.lastToLeave ?? ''}
                      onChange={(e) => handleQuickSave({ ...actualResults, lastToLeave: e.target.value || undefined })}
                      className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-3 text-cream focus:border-gold focus:outline-none"
                    >
                      <option value="">Nog niet bekend...</option>
                      {participants.map((p) => (
                        <option key={p.value} value={p.value}>{p.label}</option>
                      ))}
                    </select>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Last Guest Time */}
              <motion.div whileTap={{ scale: 0.98 }}>
                <Card className={actualResults.lastGuestTime ? 'border-success-green/50' : ''}>
                  <CardContent className="py-4">
                    <label className="block text-gold font-semibold mb-2">🕐 Laatste gast weg</label>
                    <select
                      value={actualResults.lastGuestTime ?? ''}
                      onChange={(e) => handleQuickSave({ ...actualResults, lastGuestTime: e.target.value || undefined })}
                      className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-3 text-cream focus:border-gold focus:outline-none"
                    >
                      <option value="">Nog niet bekend...</option>
                      {TIME_OPTIONS.map((t) => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

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
