'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { Button, Card, CardHeader, CardTitle, CardContent, Input, TextArea, Select } from '@/components/ui';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DynamicField } from '@/components/forms/dynamic/DynamicField';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  FormDefinition,
  FormVersion,
  FormField,
  FormFieldType,
  FormFieldOptions,
} from '@/types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface SectionWithFields {
  id: string;
  form_version_id: string;
  key: string;
  label: string;
  description?: string;
  icon?: string;
  type: 'step' | 'section';
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  fields: FormField[];
}

interface FormData {
  definition: FormDefinition;
  version: FormVersion | null;
  sections: SectionWithFields[];
}

const FIELD_TYPES: { value: FormFieldType; label: string }[] = [
  { value: 'star_rating', label: 'Sterren beoordeling' },
  { value: 'slider', label: 'Slider' },
  { value: 'text_short', label: 'Kort tekstveld' },
  { value: 'text_long', label: 'Lang tekstveld' },
  { value: 'boolean', label: 'Ja / Nee' },
  { value: 'select_options', label: 'Keuzemenu' },
  { value: 'radio_group', label: 'Radio groep' },
  { value: 'checkbox_group', label: 'Checkbox groep' },
  { value: 'select_participant', label: 'Selecteer deelnemer' },
  { value: 'time', label: 'Tijdstip' },
];

// ─── Default options per field type ─────────────────────────────────────────

function defaultOptionsForType(type: FormFieldType): FormFieldOptions {
  switch (type) {
    case 'star_rating':
      return { type: 'star_rating', maxStars: 5 };
    case 'slider':
      return { type: 'slider', min: 0, max: 10, unit: '' };
    case 'text_short':
      return { type: 'text_short' };
    case 'text_long':
      return { type: 'text_long', rows: 3 };
    case 'boolean':
      return { type: 'boolean', trueLabel: 'Ja', falseLabel: 'Nee' };
    case 'select_options':
      return { type: 'select_options', choices: [] };
    case 'radio_group':
      return { type: 'radio_group', choices: [] };
    case 'checkbox_group':
      return { type: 'checkbox_group', choices: [] };
    case 'select_participant':
      return { type: 'select_participant' };
    case 'time':
      return { type: 'time', minHour: 19, maxHour: 6 };
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function AdminFormDetailPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <DashboardLayout>
        <FormDetailContent />
      </DashboardLayout>
    </AuthGuard>
  );
}

// ─── Content ────────────────────────────────────────────────────────────────

function FormDetailContent() {
  const params = useParams();
  const formKey = params.key as string;

  const [formData, setFormData] = useState<FormData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline editing for form name/description
  const [editingHeader, setEditingHeader] = useState(false);
  const [headerName, setHeaderName] = useState('');
  const [headerDesc, setHeaderDesc] = useState('');

  // Accordion open sections
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  // Field edit modal
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [editingFieldSectionId, setEditingFieldSectionId] = useState<string | null>(null);

  // New section dialog
  const [showNewSection, setShowNewSection] = useState(false);
  const [newSectionKey, setNewSectionKey] = useState('');
  const [newSectionLabel, setNewSectionLabel] = useState('');
  const [newSectionDesc, setNewSectionDesc] = useState('');
  const [newSectionIcon, setNewSectionIcon] = useState('');

  // New field dialog
  const [addingFieldToSection, setAddingFieldToSection] = useState<string | null>(null);
  const [newFieldKey, setNewFieldKey] = useState('');
  const [newFieldLabel, setNewFieldLabel] = useState('');
  const [newFieldType, setNewFieldType] = useState<FormFieldType>('text_short');

  const fetchForm = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/forms/${formKey}`);
      if (!res.ok) throw new Error('Formulier niet gevonden');
      const data = await res.json();
      setFormData(data);
      setHeaderName(data.definition.name);
      setHeaderDesc(data.definition.description || '');
    } catch (err) {
      console.error('Error fetching form:', err);
      setError('Formulier niet gevonden');
    } finally {
      setIsLoading(false);
    }
  }, [formKey]);

  useEffect(() => {
    fetchForm();
  }, [fetchForm]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const saveHeader = async () => {
    if (!formData) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/forms/${formKey}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: headerName, description: headerDesc }),
      });
      if (res.ok) {
        await fetchForm();
        setEditingHeader(false);
      }
    } catch (err) {
      console.error('Error saving header:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleSectionActive = async (sectionId: string, currentActive: boolean) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/forms/${formKey}/sections/${sectionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (res.ok) await fetchForm();
    } catch (err) {
      console.error('Error toggling section:', err);
    } finally {
      setSaving(false);
    }
  };

  const moveSection = async (sectionId: string, direction: 'up' | 'down') => {
    if (!formData) return;
    const sections = [...formData.sections].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sections.findIndex(s => s.id === sectionId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sections.length) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/forms/${formKey}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections: [
            { id: sections[idx].id, sort_order: sections[swapIdx].sort_order },
            { id: sections[swapIdx].id, sort_order: sections[idx].sort_order },
          ],
        }),
      });
      if (res.ok) await fetchForm();
    } catch (err) {
      console.error('Error moving section:', err);
    } finally {
      setSaving(false);
    }
  };

  const toggleFieldActive = async (fieldId: string, currentActive: boolean) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/forms/${formKey}/fields/${fieldId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentActive }),
      });
      if (res.ok) await fetchForm();
    } catch (err) {
      console.error('Error toggling field:', err);
    } finally {
      setSaving(false);
    }
  };

  const moveField = async (sectionId: string, fieldId: string, direction: 'up' | 'down') => {
    if (!formData) return;
    const section = formData.sections.find(s => s.id === sectionId);
    if (!section) return;

    const fields = [...section.fields].sort((a, b) => a.sort_order - b.sort_order);
    const idx = fields.findIndex(f => f.id === fieldId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= fields.length) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/forms/${formKey}/reorder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fields: [
            { id: fields[idx].id, sort_order: fields[swapIdx].sort_order },
            { id: fields[swapIdx].id, sort_order: fields[idx].sort_order },
          ],
        }),
      });
      if (res.ok) await fetchForm();
    } catch (err) {
      console.error('Error moving field:', err);
    } finally {
      setSaving(false);
    }
  };

  const createSection = async () => {
    if (!newSectionKey || !newSectionLabel) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/forms/${formKey}/sections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_key: newSectionKey,
          label: newSectionLabel,
          description: newSectionDesc || undefined,
          icon: newSectionIcon || undefined,
        }),
      });
      if (res.ok) {
        await fetchForm();
        setShowNewSection(false);
        setNewSectionKey('');
        setNewSectionLabel('');
        setNewSectionDesc('');
        setNewSectionIcon('');
      }
    } catch (err) {
      console.error('Error creating section:', err);
    } finally {
      setSaving(false);
    }
  };

  const createField = async () => {
    if (!addingFieldToSection || !newFieldKey || !newFieldLabel || !newFieldType) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/forms/${formKey}/fields`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section_id: addingFieldToSection,
          field_key: newFieldKey,
          label: newFieldLabel,
          field_type: newFieldType,
          options: defaultOptionsForType(newFieldType),
        }),
      });
      if (res.ok) {
        await fetchForm();
        setAddingFieldToSection(null);
        setNewFieldKey('');
        setNewFieldLabel('');
        setNewFieldType('text_short');
      }
    } catch (err) {
      console.error('Error creating field:', err);
    } finally {
      setSaving(false);
    }
  };

  const saveField = async (field: FormField) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/forms/${formKey}/fields/${field.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          label: field.label,
          description: field.description,
          placeholder: field.placeholder,
          field_type: field.field_type,
          options: field.options,
          is_required: field.is_required,
          is_active: field.is_active,
        }),
      });
      if (res.ok) {
        await fetchForm();
        setEditingField(null);
        setEditingFieldSectionId(null);
      }
    } catch (err) {
      console.error('Error saving field:', err);
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
        <p className="text-cream/60">Laden...</p>
      </div>
    );
  }

  if (error || !formData) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-warm-red">{error || 'Onbekende fout'}</p>
            <Link href="/admin/formulieren" className="text-gold underline mt-4 inline-block">
              Terug naar overzicht
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { definition, sections } = formData;
  const sortedSections = [...sections].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin/formulieren">
          <Button variant="ghost">&larr; Terug</Button>
        </Link>
        <span className="text-cream/30 text-sm font-mono">{definition.key}</span>
      </div>

      {/* Form name + description */}
      <Card className="mb-6">
        <CardContent className="py-5">
          {editingHeader ? (
            <div className="space-y-3">
              <Input
                label="Naam"
                value={headerName}
                onChange={e => setHeaderName(e.target.value)}
              />
              <TextArea
                label="Beschrijving"
                value={headerDesc}
                onChange={e => setHeaderDesc(e.target.value)}
                rows={2}
              />
              <div className="flex gap-2">
                <Button onClick={saveHeader} disabled={saving}>
                  Opslaan
                </Button>
                <Button variant="ghost" onClick={() => setEditingHeader(false)}>
                  Annuleren
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <h1 className="font-display text-2xl font-bold text-gold mb-1">
                  {definition.name}
                </h1>
                {definition.description && (
                  <p className="text-cream/60">{definition.description}</p>
                )}
              </div>
              <Button variant="ghost" onClick={() => setEditingHeader(true)}>
                Bewerken
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sections accordion */}
      <div className="space-y-3">
        {sortedSections.map((section, sIdx) => {
          const isOpen = openSections.has(section.id);
          const sortedFields = [...section.fields].sort((a, b) => a.sort_order - b.sort_order);

          return (
            <Card
              key={section.id}
              className={`transition-colors ${!section.is_active ? 'opacity-50 border-cream/10' : ''}`}
            >
              {/* Section header */}
              <button
                type="button"
                onClick={() => toggleSection(section.id)}
                className="w-full text-left px-5 py-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  {section.icon && <span className="text-xl">{section.icon}</span>}
                  <div>
                    <span className="text-gold font-semibold">{section.label}</span>
                    {section.description && (
                      <p className="text-cream/40 text-sm">{section.description}</p>
                    )}
                  </div>
                  <span className="text-cream/30 text-xs font-mono ml-2">{section.key}</span>
                  {!section.is_active && (
                    <span className="text-warm-red/70 text-xs ml-2">inactief</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-cream/40 text-sm">
                    {sortedFields.filter(f => f.is_active).length} velden
                  </span>
                  <span className={`text-cream/40 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
                    &#9660;
                  </span>
                </div>
              </button>

              {/* Section controls + fields */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    {/* Section actions */}
                    <div className="px-5 py-2 flex gap-2 border-t border-gold/10">
                      <Button
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'up'); }}
                        disabled={saving || sIdx === 0}
                      >
                        &#9650; Omhoog
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); moveSection(section.id, 'down'); }}
                        disabled={saving || sIdx === sortedSections.length - 1}
                      >
                        &#9660; Omlaag
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSectionActive(section.id, section.is_active);
                        }}
                        disabled={saving}
                      >
                        {section.is_active ? 'Deactiveren' : 'Activeren'}
                      </Button>
                    </div>

                    {/* Fields list */}
                    <div className="px-5 pb-4">
                      {sortedFields.length === 0 ? (
                        <p className="text-cream/40 text-sm py-3">Geen velden in deze sectie.</p>
                      ) : (
                        <div className="space-y-1">
                          {sortedFields.map((field, fIdx) => (
                            <div
                              key={field.id}
                              className={`flex items-center gap-3 py-2 px-3 rounded-lg border border-gold/5 ${
                                !field.is_active ? 'opacity-40' : 'hover:bg-dark-wood/30'
                              }`}
                            >
                              <span className="text-cream/30 text-xs font-mono w-32 truncate">{field.key}</span>
                              <span className="text-cream flex-1 text-sm">{field.label}</span>
                              <span className="text-cream/40 text-xs w-24 text-center">
                                {FIELD_TYPES.find(t => t.value === field.field_type)?.label || field.field_type}
                              </span>
                              {field.is_required && (
                                <span className="text-gold text-xs">verplicht</span>
                              )}
                              {!field.is_active && (
                                <span className="text-warm-red/60 text-xs">inactief</span>
                              )}
                              <div className="flex gap-1 ml-2">
                                <button
                                  type="button"
                                  onClick={() => moveField(section.id, field.id, 'up')}
                                  disabled={saving || fIdx === 0}
                                  className="text-cream/30 hover:text-cream disabled:opacity-30 text-xs px-1"
                                >
                                  &#9650;
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveField(section.id, field.id, 'down')}
                                  disabled={saving || fIdx === sortedFields.length - 1}
                                  className="text-cream/30 hover:text-cream disabled:opacity-30 text-xs px-1"
                                >
                                  &#9660;
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingField({ ...field });
                                    setEditingFieldSectionId(section.id);
                                  }}
                                  className="text-gold/60 hover:text-gold text-xs px-1"
                                >
                                  Bewerk
                                </button>
                                <button
                                  type="button"
                                  onClick={() => toggleFieldActive(field.id, field.is_active)}
                                  disabled={saving}
                                  className="text-cream/30 hover:text-cream text-xs px-1"
                                >
                                  {field.is_active ? 'Uit' : 'Aan'}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add field button */}
                      <button
                        type="button"
                        onClick={() => {
                          setAddingFieldToSection(section.id);
                          setNewFieldKey('');
                          setNewFieldLabel('');
                          setNewFieldType('text_short');
                        }}
                        className="mt-3 text-gold/60 hover:text-gold text-sm"
                      >
                        + Veld toevoegen
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {/* Add section button */}
      <div className="mt-4">
        <Button
          variant="ghost"
          onClick={() => setShowNewSection(true)}
        >
          + Sectie toevoegen
        </Button>
      </div>

      {/* ─── New Section Dialog ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewSection && (
          <ModalOverlay onClose={() => setShowNewSection(false)}>
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Nieuwe Sectie</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    label="Key (uniek)"
                    value={newSectionKey}
                    onChange={e => setNewSectionKey(e.target.value)}
                    placeholder="bijv. locatie_beoordeling"
                  />
                  <Input
                    label="Label"
                    value={newSectionLabel}
                    onChange={e => setNewSectionLabel(e.target.value)}
                    placeholder="bijv. Locatie Beoordeling"
                  />
                  <Input
                    label="Icon (emoji, optioneel)"
                    value={newSectionIcon}
                    onChange={e => setNewSectionIcon(e.target.value)}
                    placeholder="bijv. &#11088;"
                  />
                  <TextArea
                    label="Beschrijving (optioneel)"
                    value={newSectionDesc}
                    onChange={e => setNewSectionDesc(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2 pt-2">
                    <Button onClick={createSection} disabled={saving || !newSectionKey || !newSectionLabel}>
                      Aanmaken
                    </Button>
                    <Button variant="ghost" onClick={() => setShowNewSection(false)}>
                      Annuleren
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ─── New Field Dialog ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {addingFieldToSection && (
          <ModalOverlay onClose={() => setAddingFieldToSection(null)}>
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Nieuw Veld</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Input
                    label="Key (uniek)"
                    value={newFieldKey}
                    onChange={e => setNewFieldKey(e.target.value)}
                    placeholder="bijv. sfeer_rating"
                  />
                  <Input
                    label="Label"
                    value={newFieldLabel}
                    onChange={e => setNewFieldLabel(e.target.value)}
                    placeholder="bijv. Hoe was de sfeer?"
                  />
                  <Select
                    label="Veldtype"
                    options={FIELD_TYPES}
                    value={newFieldType}
                    onChange={e => setNewFieldType(e.target.value as FormFieldType)}
                  />
                  <div className="flex gap-2 pt-2">
                    <Button onClick={createField} disabled={saving || !newFieldKey || !newFieldLabel}>
                      Aanmaken
                    </Button>
                    <Button variant="ghost" onClick={() => setAddingFieldToSection(null)}>
                      Annuleren
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* ─── Field Edit Dialog ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingField && (
          <FieldEditModal
            field={editingField}
            sectionId={editingFieldSectionId}
            onSave={saveField}
            onClose={() => { setEditingField(null); setEditingFieldSectionId(null); }}
            saving={saving}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Modal Overlay ──────────────────────────────────────────────────────────

function ModalOverlay({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={e => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}

// ─── Field Edit Modal ───────────────────────────────────────────────────────

function FieldEditModal({
  field: initialField,
  sectionId,
  onSave,
  onClose,
  saving,
}: {
  field: FormField;
  sectionId: string | null;
  onSave: (field: FormField) => void;
  onClose: () => void;
  saving: boolean;
}) {
  const [field, setField] = useState<FormField>({ ...initialField });
  const [previewValue, setPreviewValue] = useState<unknown>(undefined);

  const updateField = (updates: Partial<FormField>) => {
    setField(prev => ({ ...prev, ...updates }));
  };

  const updateOptions = (updates: Partial<FormFieldOptions>) => {
    setField(prev => ({
      ...prev,
      options: { ...prev.options, ...updates } as FormFieldOptions,
    }));
  };

  const handleTypeChange = (newType: FormFieldType) => {
    updateField({
      field_type: newType,
      options: defaultOptionsForType(newType),
    });
    setPreviewValue(undefined);
  };

  // Parse choices for select/radio/checkbox
  const getChoices = (): Array<{ value: string; label: string; emoji?: string }> => {
    const opts = field.options as { choices?: Array<{ value: string; label: string; emoji?: string }> };
    return opts.choices || [];
  };

  const setChoices = (choices: Array<{ value: string; label: string; emoji?: string }>) => {
    updateOptions({ choices } as Partial<FormFieldOptions>);
  };

  const addChoice = () => {
    setChoices([...getChoices(), { value: '', label: '' }]);
  };

  const updateChoice = (idx: number, updates: Partial<{ value: string; label: string; emoji: string }>) => {
    const choices = [...getChoices()];
    choices[idx] = { ...choices[idx], ...updates };
    setChoices(choices);
  };

  const removeChoice = (idx: number) => {
    setChoices(getChoices().filter((_, i) => i !== idx));
  };

  return (
    <ModalOverlay onClose={onClose}>
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Veld bewerken</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: properties */}
            <div className="space-y-3">
              <div>
                <p className="text-cream/50 text-xs mb-1">Key</p>
                <p className="text-cream font-mono text-sm bg-dark-wood/50 p-2 rounded">{field.key}</p>
              </div>

              <Input
                label="Label"
                value={field.label}
                onChange={e => updateField({ label: e.target.value })}
              />

              <TextArea
                label="Beschrijving"
                value={field.description || ''}
                onChange={e => updateField({ description: e.target.value || undefined })}
                rows={2}
              />

              <Input
                label="Placeholder"
                value={field.placeholder || ''}
                onChange={e => updateField({ placeholder: e.target.value || undefined })}
              />

              <Select
                label="Veldtype"
                options={FIELD_TYPES}
                value={field.field_type}
                onChange={e => handleTypeChange(e.target.value as FormFieldType)}
              />

              {/* Type-specific options */}
              <TypeSpecificOptions
                field={field}
                updateOptions={updateOptions}
                getChoices={getChoices}
                setChoices={setChoices}
                addChoice={addChoice}
                updateChoice={updateChoice}
                removeChoice={removeChoice}
              />

              <div className="flex items-center gap-3 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.is_required}
                    onChange={e => updateField({ is_required: e.target.checked })}
                    className="accent-gold"
                  />
                  <span className="text-cream text-sm">Verplicht</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.is_active}
                    onChange={e => updateField({ is_active: e.target.checked })}
                    className="accent-gold"
                  />
                  <span className="text-cream text-sm">Actief</span>
                </label>
              </div>
            </div>

            {/* Right: preview */}
            <div>
              <p className="text-cream/50 text-xs mb-3 uppercase tracking-wider">Preview</p>
              <div className="bg-deep-green/50 border border-gold/10 rounded-lg p-4">
                <DynamicField
                  field={field}
                  value={previewValue}
                  onChange={setPreviewValue}
                  participants={[
                    { value: 'demo1', label: 'Jan Jansen' },
                    { value: 'demo2', label: 'Piet Pietersen' },
                  ]}
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-6 border-t border-gold/10 mt-6">
            <Button onClick={() => onSave(field)} disabled={saving}>
              Opslaan
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Annuleren
            </Button>
          </div>
        </CardContent>
      </Card>
    </ModalOverlay>
  );
}

// ─── Type-Specific Options ──────────────────────────────────────────────────

function TypeSpecificOptions({
  field,
  updateOptions,
  getChoices,
  addChoice,
  updateChoice,
  removeChoice,
}: {
  field: FormField;
  updateOptions: (updates: Partial<FormFieldOptions>) => void;
  getChoices: () => Array<{ value: string; label: string; emoji?: string }>;
  setChoices: (c: Array<{ value: string; label: string; emoji?: string }>) => void;
  addChoice: () => void;
  updateChoice: (idx: number, u: Partial<{ value: string; label: string; emoji: string }>) => void;
  removeChoice: (idx: number) => void;
}) {
  const opts = field.options as unknown as Record<string, unknown>;

  switch (field.field_type) {
    case 'star_rating':
      return (
        <Input
          label="Aantal sterren"
          type="number"
          value={String(opts.maxStars || 5)}
          onChange={e => updateOptions({ maxStars: parseInt(e.target.value) || 5 } as Partial<FormFieldOptions>)}
        />
      );

    case 'slider':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min"
              type="number"
              value={String(opts.min ?? 0)}
              onChange={e => updateOptions({ min: parseInt(e.target.value) || 0 } as Partial<FormFieldOptions>)}
            />
            <Input
              label="Max"
              type="number"
              value={String(opts.max ?? 10)}
              onChange={e => updateOptions({ max: parseInt(e.target.value) || 10 } as Partial<FormFieldOptions>)}
            />
          </div>
          <Input
            label="Eenheid"
            value={String(opts.unit || '')}
            onChange={e => updateOptions({ unit: e.target.value } as Partial<FormFieldOptions>)}
            placeholder="bijv. kg, %, stuks"
          />
          <Input
            label="Hint"
            value={String(opts.hint || '')}
            onChange={e => updateOptions({ hint: e.target.value } as Partial<FormFieldOptions>)}
          />
        </div>
      );

    case 'text_short':
      return (
        <Input
          label="Max lengte"
          type="number"
          value={String(opts.maxLength || '')}
          onChange={e => updateOptions({ maxLength: parseInt(e.target.value) || undefined } as Partial<FormFieldOptions>)}
        />
      );

    case 'text_long':
      return (
        <div className="space-y-2">
          <Input
            label="Rijen"
            type="number"
            value={String(opts.rows || 3)}
            onChange={e => updateOptions({ rows: parseInt(e.target.value) || 3 } as Partial<FormFieldOptions>)}
          />
          <Input
            label="Max lengte"
            type="number"
            value={String(opts.maxLength || '')}
            onChange={e => updateOptions({ maxLength: parseInt(e.target.value) || undefined } as Partial<FormFieldOptions>)}
          />
        </div>
      );

    case 'boolean':
      return (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Ja-label"
              value={String(opts.trueLabel || 'Ja')}
              onChange={e => updateOptions({ trueLabel: e.target.value } as Partial<FormFieldOptions>)}
            />
            <Input
              label="Nee-label"
              value={String(opts.falseLabel || 'Nee')}
              onChange={e => updateOptions({ falseLabel: e.target.value } as Partial<FormFieldOptions>)}
            />
          </div>
        </div>
      );

    case 'time':
      return (
        <div className="grid grid-cols-2 gap-2">
          <Input
            label="Start uur"
            type="number"
            value={String(opts.minHour ?? 19)}
            onChange={e => updateOptions({ minHour: parseInt(e.target.value) || 0 } as Partial<FormFieldOptions>)}
          />
          <Input
            label="Eind uur"
            type="number"
            value={String(opts.maxHour ?? 6)}
            onChange={e => updateOptions({ maxHour: parseInt(e.target.value) || 24 } as Partial<FormFieldOptions>)}
          />
        </div>
      );

    case 'select_options':
    case 'radio_group':
    case 'checkbox_group':
      return (
        <div className="space-y-2">
          <p className="text-cream/50 text-xs">Keuzes</p>
          {getChoices().map((choice, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <Input
                label={idx === 0 ? 'Value' : undefined}
                value={choice.value}
                onChange={e => updateChoice(idx, { value: e.target.value })}
                placeholder="value"
              />
              <Input
                label={idx === 0 ? 'Label' : undefined}
                value={choice.label}
                onChange={e => updateChoice(idx, { label: e.target.value })}
                placeholder="label"
              />
              <button
                type="button"
                onClick={() => removeChoice(idx)}
                className="text-warm-red/60 hover:text-warm-red text-sm pb-2"
              >
                X
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addChoice}
            className="text-gold/60 hover:text-gold text-sm"
          >
            + Keuze toevoegen
          </button>
        </div>
      );

    case 'select_participant':
      return (
        <p className="text-cream/40 text-sm">
          Deelnemerslijst wordt automatisch geladen.
        </p>
      );

    default:
      return null;
  }
}
