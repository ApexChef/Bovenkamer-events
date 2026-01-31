'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/AuthGuard';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Select, TextArea } from '@/components/ui';
import Link from 'next/link';
import { Plus, Pencil, Trash2, ChevronRight, ShoppingCart, CalendarDays, Users, UtensilsCrossed, Package, BookOpen, Eye, EyeOff } from 'lucide-react';
import type {
  MenuEvent,
  EventWithCourseCount,
  EventWithDetails,
  EventCourse,
  MenuItem,
  MenuCardCourse,
  CreateMenuCardCourseData,
  CreateEventData,
  CreateCourseData,
  CreateMenuItemData,
  MeatDistribution,
  MeatDistributionBreakdown,
  ShoppingListResponse,
} from '@/types';

// =============================================================================
// LABELS & CONSTANTS
// =============================================================================

const eventTypeLabels: Record<string, string> = {
  bbq: 'BBQ',
  diner: 'Diner',
  lunch: 'Lunch',
  borrel: 'Borrel',
  receptie: 'Receptie',
  overig: 'Overig',
};

const statusColors = {
  draft: 'bg-gray-500/20 text-gray-300',
  active: 'bg-green-500/20 text-green-300',
  completed: 'bg-blue-500/20 text-blue-300',
  cancelled: 'bg-red-500/20 text-red-300',
};

const statusLabels: Record<string, string> = {
  draft: 'Concept',
  active: 'Actief',
  completed: 'Voltooid',
  cancelled: 'Geannuleerd',
};

const typeColors = {
  protein: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  side: 'bg-green-500/20 text-green-300 border-green-500/30',
  fixed: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
};

const typeLabels: Record<string, string> = {
  protein: 'Eiwit',
  side: 'Bijgerecht',
  fixed: 'Vast',
};

const categoryLabels: Record<string, string> = {
  pork: 'Varken',
  beef: 'Rund',
  chicken: 'Kip',
  game: 'Wild',
  fish: 'Vis',
  vegetarian: 'Vegetarisch',
  fruit: 'Fruit',
  vegetables: 'Groenten',
  salad: 'Salade',
  bread: 'Brood',
  sauce: 'Saus',
  dairy: 'Zuivel',
  other: 'Overig',
};

const proteinCategories = ['pork', 'beef', 'chicken', 'game', 'fish', 'vegetarian'];
const otherCategories = ['fruit', 'vegetables', 'salad', 'bread', 'sauce', 'dairy', 'other'];

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function formatNumber(num: number): string {
  return new Intl.NumberFormat('nl-NL').format(num);
}

function formatGrams(grams: number): string {
  if (grams >= 1000) {
    return `${(grams / 1000).toFixed(1)} kg`;
  }
  return `${formatNumber(Math.round(grams))} g`;
}

// =============================================================================
// MODAL COMPONENT
// =============================================================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-2xl bg-dark-wood border border-gold/30 rounded-lg p-6 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl font-bold text-gold">{title}</h2>
          <button
            onClick={onClose}
            className="text-cream/60 hover:text-cream transition-colors text-2xl leading-none"
          >
            &times;
          </button>
        </div>
        {children}
      </motion.div>
    </div>
  );
}

// =============================================================================
// EVENT DIALOG
// =============================================================================

interface EventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  event: MenuEvent | null;
  onSave: () => void;
}

function EventDialog({ isOpen, onClose, event, onSave }: EventDialogProps) {
  const [formData, setFormData] = useState<CreateEventData>({
    name: '',
    eventType: 'bbq',
    eventDate: null,
    totalPersons: null,
    status: 'draft',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (event) {
      setFormData({
        name: event.name,
        eventType: event.eventType,
        eventDate: event.eventDate,
        totalPersons: event.totalPersons,
        status: event.status,
        notes: event.notes || '',
      });
    } else {
      setFormData({
        name: '',
        eventType: 'bbq',
        eventDate: null,
        totalPersons: null,
        status: 'draft',
        notes: '',
      });
    }
    setError('');
  }, [event, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const url = event ? `/api/admin/events/${event.id}` : '/api/admin/events';
      const method = event ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || 'Er is een fout opgetreden');
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event ? 'Event bewerken' : 'Nieuw event'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-warm-red/10 border border-warm-red/30 rounded-lg p-4">
            <p className="text-warm-red text-sm">{error}</p>
          </div>
        )}

        <Input
          label="Naam"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />

        <Select
          label="Type"
          value={formData.eventType}
          onChange={(e) => setFormData({ ...formData, eventType: e.target.value as any })}
          options={[
            { value: 'bbq', label: 'BBQ' },
            { value: 'diner', label: 'Diner' },
            { value: 'lunch', label: 'Lunch' },
            { value: 'borrel', label: 'Borrel' },
            { value: 'receptie', label: 'Receptie' },
            { value: 'overig', label: 'Overig' },
          ]}
        />

        <Input
          label="Datum"
          type="date"
          value={formData.eventDate || ''}
          onChange={(e) => setFormData({ ...formData, eventDate: e.target.value || null })}
        />

        <Input
          label="Aantal personen"
          type="number"
          min="1"
          value={formData.totalPersons?.toString() || ''}
          onChange={(e) => setFormData({ ...formData, totalPersons: e.target.value ? parseInt(e.target.value) : null })}
        />

        <Select
          label="Status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
          options={[
            { value: 'draft', label: 'Concept' },
            { value: 'active', label: 'Actief' },
            { value: 'completed', label: 'Voltooid' },
            { value: 'cancelled', label: 'Geannuleerd' },
          ]}
        />

        <TextArea
          label="Notities"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />

        <div className="flex gap-3 pt-4">
          <Button type="submit" isLoading={isSaving}>
            {event ? 'Bijwerken' : 'Aanmaken'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuleren
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// =============================================================================
// COURSE DIALOG
// =============================================================================

interface CourseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  course: EventCourse | null;
  existingCount: number;
  onSave: () => void;
}

function CourseDialog({ isOpen, onClose, eventId, course, existingCount, onSave }: CourseDialogProps) {
  const [formData, setFormData] = useState<CreateCourseData>({
    name: '',
    sortOrder: existingCount + 1,
    gramsPerPerson: 450,
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (course) {
      setFormData({
        name: course.name,
        sortOrder: course.sortOrder,
        gramsPerPerson: course.gramsPerPerson,
        notes: course.notes || '',
      });
    } else {
      setFormData({
        name: '',
        sortOrder: existingCount + 1,
        gramsPerPerson: 450,
        notes: '',
      });
    }
    setError('');
  }, [course, existingCount, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const url = course
        ? `/api/admin/courses/${course.id}`
        : `/api/admin/events/${eventId}/courses`;
      const method = course ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || 'Er is een fout opgetreden');
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={course ? 'Gang bewerken' : 'Gang toevoegen'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-warm-red/10 border border-warm-red/30 rounded-lg p-4">
            <p className="text-warm-red text-sm">{error}</p>
          </div>
        )}

        <Input
          label="Naam"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Bijvoorbeeld: Voorgerecht, Hoofdgerecht"
          required
        />

        <Input
          label="Gram per persoon"
          type="number"
          min="1"
          value={formData.gramsPerPerson.toString()}
          onChange={(e) => setFormData({ ...formData, gramsPerPerson: parseInt(e.target.value) || 0 })}
          required
        />

        <Input
          label="Volgorde"
          type="number"
          min="1"
          value={formData.sortOrder.toString()}
          onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
          required
        />

        <TextArea
          label="Notities"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />

        <div className="flex gap-3 pt-4">
          <Button type="submit" isLoading={isSaving}>
            {course ? 'Bijwerken' : 'Toevoegen'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuleren
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// =============================================================================
// MENU ITEM DIALOG
// =============================================================================

interface MenuItemDialogProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  menuItem: MenuItem | null;
  existingCount: number;
  onSave: () => void;
}

function MenuItemDialog({ isOpen, onClose, courseId, menuItem, existingCount, onSave }: MenuItemDialogProps) {
  const [formData, setFormData] = useState<CreateMenuItemData>({
    name: '',
    itemType: 'protein',
    category: null,
    yieldPercentage: 100,
    wasteDescription: '',
    unitWeightGrams: null,
    unitLabel: '',
    roundingGrams: null,
    distributionPercentage: null,
    gramsPerPerson: null,
    sortOrder: existingCount + 1,
    isActive: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (menuItem) {
      setFormData({
        name: menuItem.name,
        itemType: menuItem.itemType,
        category: menuItem.category,
        yieldPercentage: menuItem.yieldPercentage,
        wasteDescription: menuItem.wasteDescription || '',
        unitWeightGrams: menuItem.unitWeightGrams,
        unitLabel: menuItem.unitLabel || '',
        roundingGrams: menuItem.roundingGrams,
        distributionPercentage: menuItem.distributionPercentage,
        gramsPerPerson: menuItem.gramsPerPerson,
        sortOrder: menuItem.sortOrder,
        isActive: menuItem.isActive,
      });
    } else {
      setFormData({
        name: '',
        itemType: 'protein',
        category: null,
        yieldPercentage: 100,
        wasteDescription: '',
        unitWeightGrams: null,
        unitLabel: '',
        roundingGrams: null,
        distributionPercentage: null,
        gramsPerPerson: null,
        sortOrder: existingCount + 1,
        isActive: true,
      });
    }
    setError('');
  }, [menuItem, existingCount, isOpen]);

  const handleTypeChange = (newType: MenuItem['itemType']) => {
    setFormData({
      ...formData,
      itemType: newType,
      category: null,
      distributionPercentage: newType === 'protein' ? 100 : null,
      gramsPerPerson: newType === 'fixed' ? 100 : null,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const url = menuItem
        ? `/api/admin/menu-items/${menuItem.id}`
        : `/api/admin/courses/${courseId}/items`;
      const method = menuItem ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || 'Er is een fout opgetreden');
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setIsSaving(false);
    }
  };

  const categoryOptions =
    formData.itemType === 'protein'
      ? proteinCategories.map((cat) => ({ value: cat, label: categoryLabels[cat] }))
      : otherCategories.map((cat) => ({ value: cat, label: categoryLabels[cat] }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={menuItem ? 'Menu-item bewerken' : 'Menu-item toevoegen'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-warm-red/10 border border-warm-red/30 rounded-lg p-4">
            <p className="text-warm-red text-sm">{error}</p>
          </div>
        )}

        <Input
          label="Naam"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Bijvoorbeeld: Picanha, Courgette"
          required
        />

        <Select
          label="Type"
          value={formData.itemType}
          onChange={(e) => handleTypeChange(e.target.value as MenuItem['itemType'])}
          options={[
            { value: 'protein', label: 'Eiwit' },
            { value: 'side', label: 'Bijgerecht' },
            { value: 'fixed', label: 'Vast' },
          ]}
        />

        <Select
          label="Categorie"
          value={formData.category || ''}
          onChange={(e) => setFormData({ ...formData, category: e.target.value || null })}
          options={[{ value: '', label: '-- Selecteer categorie --' }, ...categoryOptions]}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Rendement (%)"
            type="number"
            min="1"
            max="100"
            value={formData.yieldPercentage.toString()}
            onChange={(e) => setFormData({ ...formData, yieldPercentage: parseInt(e.target.value) || 100 })}
            hint="Percentage na verwerking (100% = geen afval)"
            required
          />

          <Input
            label="Volgorde"
            type="number"
            min="1"
            value={formData.sortOrder.toString()}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
            required
          />
        </div>

        <TextArea
          label="Afval beschrijving"
          value={formData.wasteDescription}
          onChange={(e) => setFormData({ ...formData, wasteDescription: e.target.value })}
          placeholder="Bijvoorbeeld: Vet, botten"
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Eenheid gewicht (g)"
            type="number"
            min="1"
            value={formData.unitWeightGrams?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, unitWeightGrams: e.target.value ? parseInt(e.target.value) : null })}
            hint="Voor stuks (bijv. 150g per hamburger)"
          />

          <Input
            label="Eenheid label"
            value={formData.unitLabel}
            onChange={(e) => setFormData({ ...formData, unitLabel: e.target.value })}
            placeholder="stuks, hamburgers"
          />
        </div>

        <Input
          label="Afronden (g)"
          type="number"
          min="1"
          value={formData.roundingGrams?.toString() || ''}
          onChange={(e) => setFormData({ ...formData, roundingGrams: e.target.value ? parseInt(e.target.value) : null })}
          hint="Afrondingswaarde (bijv. 100g)"
        />

        {formData.itemType === 'protein' && (
          <Input
            label="Distributie percentage (%)"
            type="number"
            min="0"
            max="100"
            value={formData.distributionPercentage?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, distributionPercentage: e.target.value ? parseInt(e.target.value) : null })}
            hint="Percentage van categorie (bijv. 50% van rundvlees)"
            required
          />
        )}

        {formData.itemType === 'fixed' && (
          <Input
            label="Gram per persoon"
            type="number"
            min="1"
            value={formData.gramsPerPerson?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, gramsPerPerson: e.target.value ? parseInt(e.target.value) : null })}
            hint="Vast aantal gram per persoon"
            required
          />
        )}

        <div className="flex gap-3 pt-4">
          <Button type="submit" isLoading={isSaving}>
            {menuItem ? 'Bijwerken' : 'Toevoegen'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuleren
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// =============================================================================
// EVENT LIST COMPONENT
// =============================================================================

interface EventListProps {
  events: EventWithCourseCount[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  onNewEvent: () => void;
}

function EventList({ events, selectedEventId, onSelectEvent, onNewEvent }: EventListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-gold">Events</h2>
        <Button size="sm" onClick={onNewEvent}>
          <Plus className="w-4 h-4 mr-1" />
          Nieuw Event
        </Button>
      </div>

      <div className="space-y-2">
        {events.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <UtensilsCrossed className="w-12 h-12 text-cream/30 mx-auto mb-3" />
              <p className="text-cream/60 text-sm">Geen events</p>
            </CardContent>
          </Card>
        ) : (
          events.map((event) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  selectedEventId === event.id ? 'ring-2 ring-gold' : 'hover:border-gold/40'
                }`}
                onClick={() => onSelectEvent(event.id)}
              >
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-cream truncate">{event.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">
                          {eventTypeLabels[event.eventType]}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded ${statusColors[event.status]}`}>
                          {statusLabels[event.status]}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-cream/60">
                        {event.eventDate && (
                          <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {formatDate(event.eventDate)}
                          </span>
                        )}
                        {event.totalPersons && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {event.totalPersons} pers.
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <UtensilsCrossed className="w-3 h-3" />
                          {event.courseCount} {event.courseCount === 1 ? 'gang' : 'gangen'}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gold/60 flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

// =============================================================================
// MENU ITEM CARD
// =============================================================================

interface MenuItemCardProps {
  item: MenuItem;
  onEdit: () => void;
  onDelete: () => void;
}

function MenuItemCard({ item, onEdit, onDelete }: MenuItemCardProps) {
  return (
    <div className="border border-gold/20 rounded-lg p-3 bg-dark-wood/30">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-medium text-cream">{item.name}</h4>
            <span className={`text-xs px-2 py-0.5 rounded border ${typeColors[item.itemType]}`}>
              {typeLabels[item.itemType]}
            </span>
            {item.category && (
              <span className="text-xs px-2 py-0.5 rounded bg-cream/10 text-cream/70">
                {categoryLabels[item.category]}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-cream/60">
            <span>Rendement: {item.yieldPercentage}%</span>
            {item.itemType === 'protein' && item.distributionPercentage && (
              <span>Distributie: {item.distributionPercentage}%</span>
            )}
            {item.itemType === 'fixed' && item.gramsPerPerson && (
              <span>Gram/p.p.: {item.gramsPerPerson}g</span>
            )}
            {item.unitLabel && (
              <span>Eenheid: {item.unitLabel}</span>
            )}
          </div>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={onEdit}
            className="p-1.5 rounded hover:bg-gold/10 text-gold/60 hover:text-gold transition-colors"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 rounded hover:bg-warm-red/10 text-warm-red/60 hover:text-warm-red transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// COURSE CARD
// =============================================================================

interface CourseCardProps {
  course: EventCourse & { menuItems: MenuItem[] };
  onEditCourse: () => void;
  onDeleteCourse: () => void;
  onAddMenuItem: () => void;
  onEditMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (item: MenuItem) => void;
}

function CourseCard({
  course,
  onEditCourse,
  onDeleteCourse,
  onAddMenuItem,
  onEditMenuItem,
  onDeleteMenuItem,
}: CourseCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle>{course.name}</CardTitle>
            <CardDescription>{course.gramsPerPerson}g per persoon</CardDescription>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={onEditCourse}
              className="p-1.5 rounded hover:bg-gold/10 text-gold/60 hover:text-gold transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={onDeleteCourse}
              className="p-1.5 rounded hover:bg-warm-red/10 text-warm-red/60 hover:text-warm-red transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {course.menuItems.length === 0 ? (
            <p className="text-cream/60 text-sm text-center py-4">Geen menu-items</p>
          ) : (
            course.menuItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                onEdit={() => onEditMenuItem(item)}
                onDelete={() => onDeleteMenuItem(item)}
              />
            ))
          )}
        </div>
        <Button size="sm" variant="ghost" onClick={onAddMenuItem} className="w-full mt-3">
          <Plus className="w-4 h-4 mr-1" />
          Menu-item toevoegen
        </Button>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// SHOPPING LIST SECTION
// =============================================================================

interface ShoppingListSectionProps {
  eventId: string;
  totalPersons: number;
  hasCourses: boolean;
  refreshTrigger: number;
}

function ShoppingListSection({ eventId, totalPersons, hasCourses, refreshTrigger }: ShoppingListSectionProps) {
  const [data, setData] = useState<ShoppingListResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchShoppingList = useCallback(async () => {
    if (!hasCourses || totalPersons <= 0) return;

    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/shopping-list/${eventId}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || 'Fout bij ophalen inkooplijst');
      }
      const result = await res.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setIsLoading(false);
    }
  }, [eventId, hasCourses, totalPersons, refreshTrigger]);

  useEffect(() => {
    fetchShoppingList();
  }, [fetchShoppingList]);

  if (!hasCourses || totalPersons <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Inkooplijst
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-cream/60 text-sm text-center py-4">
            Voeg gangen en menu-items toe en stel het aantal personen in om de inkooplijst te genereren.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Inkooplijst
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cream/60">Berekenen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Inkooplijst
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="bg-warm-red/10 border border-warm-red/30 rounded-lg p-4 mb-4">
              <p className="text-warm-red text-sm">{error}</p>
            </div>
          )}
          <Button onClick={fetchShoppingList} size="sm">
            Opnieuw proberen
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Inkooplijst
          </CardTitle>
          <p className="text-cream/60 text-sm">{data.event.totalPersons} personen</p>
        </div>
      </CardHeader>
      <CardContent>
        {/* Average meat distribution */}
        <div className="bg-gold/5 border border-gold/20 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-gold mb-3 text-sm">Gemiddelde vlees distributie</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs">
            {Object.entries(data.averageMeatDistribution).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="text-cream/70">{categoryLabels[key]}:</span>
                <span className="text-cream font-medium">{value.toFixed(1)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Courses */}
        <div className="space-y-6">
          {data.courses.map((course) => {
            // Find meat distribution breakdown for this course
            const breakdown = data.meatDistributionBreakdown?.find(
              (b: MeatDistributionBreakdown) => b.courseId === course.courseId
            );

            return (
              <div key={course.courseId}>
                <h4 className="font-semibold text-gold mb-2">
                  {course.courseName} ({course.gramsPerPerson}g/p.p.)
                </h4>

                {/* Meat distribution breakdown for protein courses */}
                {breakdown && (
                  <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3 mb-3">
                    <h5 className="text-xs font-semibold text-blue-300 mb-2">
                      Vleesverdeling {course.courseName} ({formatGrams(breakdown.totalCourseGrams)} totaal)
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-xs">
                      {breakdown.categories.map((cat: MeatDistributionBreakdown['categories'][number]) => (
                        <div key={cat.category} className="flex items-center gap-2">
                          <span className="text-cream/70 w-20">{categoryLabels[cat.category]}</span>
                          <span className="text-cream/50 w-12 text-right">{cat.percentage.toFixed(1)}%</span>
                          <span className="text-cream/40 mx-1">&rarr;</span>
                          <span className="text-cream font-medium">{formatGrams(cat.gramsNeeded)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gold/20">
                        <th className="text-left py-2 px-2 text-gold/70 font-normal text-xs">Item</th>
                        <th className="text-center py-2 px-2 text-gold/70 font-normal text-xs">Type</th>
                        <th className="text-right py-2 px-2 text-gold/70 font-normal text-xs">Netto</th>
                        <th className="text-right py-2 px-2 text-gold/70 font-normal text-xs">Bruto</th>
                        <th className="text-right py-2 px-2 text-gold/70 font-normal text-xs">Nodig</th>
                        <th className="text-right py-2 px-2 text-gold/70 font-normal text-xs">Ingekocht</th>
                        <th className="text-right py-2 px-2 text-gold/70 font-normal text-xs">Over</th>
                        <th className="text-right py-2 px-2 text-gold/70 font-normal text-xs">Eenheid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.items.map((item) => (
                        <tr key={item.menuItemId} className="border-b border-gold/10">
                          <td className="py-2 px-2 text-cream">{item.name}</td>
                          <td className="text-center py-2 px-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${typeColors[item.itemType]}`}>
                              {typeLabels[item.itemType]}
                            </span>
                          </td>
                          <td className="text-right py-2 px-2 text-cream/70">{formatGrams(item.edibleGrams)}</td>
                          <td className="text-right py-2 px-2 text-cream/70">{formatGrams(item.brutoGrams)}</td>
                          <td className="text-right py-2 px-2 text-cream font-medium">
                            {formatGrams(item.purchaseQuantity)}
                          </td>
                          <td className={`text-right py-2 px-2 font-medium ${
                            item.receivedQuantity === null
                              ? 'text-cream/40'
                              : item.receivedQuantity >= item.purchaseQuantity
                                ? 'text-green-400'
                                : 'text-red-400'
                          }`}>
                            {item.receivedQuantity !== null ? formatGrams(item.receivedQuantity) : '-'}
                          </td>
                          <td className={`text-right py-2 px-2 font-medium ${
                            item.surplus === null
                              ? 'text-cream/40'
                              : item.surplus >= 0
                                ? 'text-green-400'
                                : 'text-red-400'
                          }`}>
                            {item.surplus !== null
                              ? `${item.surplus >= 0 ? '+' : ''}${formatGrams(item.surplus)}`
                              : '-'}
                          </td>
                          <td className="text-right py-2 px-2 text-cream/70">
                            {item.purchaseUnits ? `${item.purchaseUnits} ${item.unitLabel || 'stuks'}` : item.unit}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-gold/30 font-semibold">
                        <td className="py-2 px-2 text-gold" colSpan={2}>Subtotaal</td>
                        <td className="text-right py-2 px-2 text-gold">{formatGrams(course.subtotal.totalEdibleGrams)}</td>
                        <td className="text-right py-2 px-2 text-gold">{formatGrams(course.subtotal.totalBrutoGrams)}</td>
                        <td className="text-right py-2 px-2 text-gold">{formatGrams(course.subtotal.totalPurchaseGrams)}</td>
                        <td className="text-right py-2 px-2 text-gold">
                          {course.subtotal.totalReceivedGrams !== null ? formatGrams(course.subtotal.totalReceivedGrams) : '-'}
                        </td>
                        <td className={`text-right py-2 px-2 font-semibold ${
                          course.subtotal.totalSurplusGrams === null
                            ? 'text-cream/40'
                            : course.subtotal.totalSurplusGrams >= 0
                              ? 'text-green-400'
                              : 'text-red-400'
                        }`}>
                          {course.subtotal.totalSurplusGrams !== null
                            ? `${course.subtotal.totalSurplusGrams >= 0 ? '+' : ''}${formatGrams(course.subtotal.totalSurplusGrams)}`
                            : '-'}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Grand total */}
          <div className="border-t-2 border-gold/50 pt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left py-1 px-2 text-gold/70 font-normal text-xs"></th>
                    <th className="text-right py-1 px-2 text-gold/70 font-normal text-xs">Netto</th>
                    <th className="text-right py-1 px-2 text-gold/70 font-normal text-xs">Bruto</th>
                    <th className="text-right py-1 px-2 text-gold/70 font-normal text-xs">Nodig</th>
                    <th className="text-right py-1 px-2 text-gold/70 font-normal text-xs">Ingekocht</th>
                    <th className="text-right py-1 px-2 text-gold/70 font-normal text-xs">Over</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="font-bold text-gold">
                    <td className="py-2 px-2">Totaal</td>
                    <td className="text-right py-2 px-2">{formatGrams(data.grandTotal.totalEdibleGrams)}</td>
                    <td className="text-right py-2 px-2">{formatGrams(data.grandTotal.totalBrutoGrams)}</td>
                    <td className="text-right py-2 px-2 text-lg">{formatGrams(data.grandTotal.totalPurchaseGrams)}</td>
                    <td className="text-right py-2 px-2">
                      {data.grandTotal.totalReceivedGrams !== null ? formatGrams(data.grandTotal.totalReceivedGrams) : '-'}
                    </td>
                    <td className={`text-right py-2 px-2 ${
                      data.grandTotal.totalSurplusGrams === null
                        ? 'text-cream/40'
                        : data.grandTotal.totalSurplusGrams >= 0
                          ? 'text-green-400'
                          : 'text-red-400'
                    }`}>
                      {data.grandTotal.totalSurplusGrams !== null
                        ? `${data.grandTotal.totalSurplusGrams >= 0 ? '+' : ''}${formatGrams(data.grandTotal.totalSurplusGrams)}`
                        : '-'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =============================================================================
// MENU CARD DIALOG
// =============================================================================

const ITEM_CATEGORY_OPTIONS = [
  { value: '', label: '(geen)' },
  { value: 'pork', label: 'Varken' },
  { value: 'beef', label: 'Rund' },
  { value: 'chicken', label: 'Kip' },
  { value: 'game', label: 'Wild' },
  { value: 'fish', label: 'Vis' },
  { value: 'vegetarian', label: 'Vegetarisch' },
];

interface MenuCardDialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  course: MenuCardCourse | null;
  existingCount: number;
  onSave: () => void;
}

function MenuCardDialog({ isOpen, onClose, eventId, course, existingCount, onSave }: MenuCardDialogProps) {
  const [formData, setFormData] = useState<CreateMenuCardCourseData>({
    title: '',
    subtitle: '',
    items: '',
    itemCategories: '',
    wineRed: '',
    wineWhite: '',
    sortOrder: existingCount + 1,
    isVisible: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        subtitle: course.subtitle || '',
        items: course.items,
        itemCategories: course.itemCategories || '',
        wineRed: course.wineRed || '',
        wineWhite: course.wineWhite || '',
        sortOrder: course.sortOrder,
        isVisible: course.isVisible,
      });
    } else {
      setFormData({
        title: '',
        subtitle: '',
        items: '',
        itemCategories: '',
        wineRed: '',
        wineWhite: '',
        sortOrder: existingCount + 1,
        isVisible: true,
      });
    }
    setError('');
  }, [course, existingCount, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const url = course
        ? `/api/admin/menu-card/${course.id}`
        : '/api/admin/menu-card';
      const method = course ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(course ? formData : { ...formData, eventId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || data.error || 'Er is een fout opgetreden');
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is een fout opgetreden');
    } finally {
      setIsSaving(false);
    }
  };

  // Parse items to show per-item category selectors
  const itemLines = formData.items.split('\n').filter(Boolean);
  const categoryLines = formData.itemCategories.split('\n');

  const handleCategoryChange = (index: number, value: string) => {
    const cats = formData.items.split('\n').filter(Boolean).map((_, i) => {
      if (i === index) return value;
      return categoryLines[i]?.trim() || '';
    });
    setFormData({ ...formData, itemCategories: cats.join('\n') });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={course ? 'Menukaart gang bewerken' : 'Menukaart gang toevoegen'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-warm-red/10 border border-warm-red/30 rounded-lg p-4">
            <p className="text-warm-red text-sm">{error}</p>
          </div>
        )}

        <Input
          label="Titel"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Bijvoorbeeld: BBQ Vlees"
          required
        />

        <Input
          label="Subtitel"
          value={formData.subtitle}
          onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
          placeholder="Optionele beschrijving"
        />

        <TextArea
          label="Items (1 per regel)"
          value={formData.items}
          onChange={(e) => setFormData({ ...formData, items: e.target.value })}
          placeholder="Grilled Picanha&#10;Spare ribs met huisglazuur&#10;..."
          rows={6}
          required
        />

        {/* Per-item category selectors */}
        {itemLines.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-cream/70 mb-2">
              Eiwitcategorie per item
            </label>
            <p className="text-xs text-cream/40 mb-3">
              Kies per item een categorie voor de personalisatie. Laat leeg als het item geen eiwitcategorie heeft.
            </p>
            <div className="space-y-2">
              {itemLines.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-cream/60 text-sm flex-1 truncate">{item}</span>
                  <select
                    value={categoryLines[i]?.trim() || ''}
                    onChange={(e) => handleCategoryChange(i, e.target.value)}
                    className="bg-dark-wood border border-gold/30 rounded px-2 py-1 text-sm text-cream focus:border-gold focus:outline-none"
                  >
                    {ITEM_CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Rode wijn suggestie"
            value={formData.wineRed}
            onChange={(e) => setFormData({ ...formData, wineRed: e.target.value })}
            placeholder="Malbec uit Argentinië"
          />
          <Input
            label="Witte wijn suggestie"
            value={formData.wineWhite}
            onChange={(e) => setFormData({ ...formData, wineWhite: e.target.value })}
            placeholder="Sauvignon Blanc"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Volgorde"
            type="number"
            min="1"
            value={formData.sortOrder.toString()}
            onChange={(e) => setFormData({ ...formData, sortOrder: parseInt(e.target.value) || 1 })}
            required
          />
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isVisible}
                onChange={(e) => setFormData({ ...formData, isVisible: e.target.checked })}
                className="w-4 h-4 rounded border-gold/30 bg-dark-wood text-gold focus:ring-gold"
              />
              <span className="text-sm text-cream/70">Zichtbaar op menukaart</span>
            </label>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <Button type="submit" isLoading={isSaving}>
            {course ? 'Bijwerken' : 'Toevoegen'}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Annuleren
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// =============================================================================
// MENU CARD SECTION
// =============================================================================

interface MenuCardSectionProps {
  eventId: string;
}

function MenuCardSection({ eventId }: MenuCardSectionProps) {
  const [courses, setCourses] = useState<MenuCardCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<MenuCardCourse | null>(null);

  const fetchCourses = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/menu-card?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setCourses(data.courses || []);
      }
    } catch (error) {
      console.error('Error fetching menu card courses:', error);
    } finally {
      setIsLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleAdd = () => {
    setEditingCourse(null);
    setDialogOpen(true);
  };

  const handleEdit = (course: MenuCardCourse) => {
    setEditingCourse(course);
    setDialogOpen(true);
  };

  const handleDelete = (course: MenuCardCourse) => {
    if (window.confirm(`Weet je zeker dat je "${course.title}" wilt verwijderen?`)) {
      fetch(`/api/admin/menu-card/${course.id}`, { method: 'DELETE' })
        .then((res) => {
          if (res.ok) fetchCourses();
          else alert('Fout bij verwijderen');
        });
    }
  };

  const sortedCourses = [...courses].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-xl font-bold text-gold flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Menukaart
        </h3>
        <Button size="sm" onClick={handleAdd}>
          <Plus className="w-4 h-4 mr-1" />
          Gang toevoegen
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">
          <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
        </div>
      ) : sortedCourses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <BookOpen className="w-12 h-12 text-cream/30 mx-auto mb-3" />
            <p className="text-cream/60 text-sm">Nog geen menukaart gangen</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sortedCourses.map((course) => {
            const items = course.items.split('\n').filter(Boolean);
            const categories = course.itemCategories?.split('\n') || [];

            return (
              <Card key={course.id}>
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-cream">{course.title}</h4>
                        {!course.isVisible && (
                          <span className="flex items-center gap-1 text-xs text-cream/40">
                            <EyeOff className="w-3 h-3" />
                            Verborgen
                          </span>
                        )}
                        {course.isVisible && (
                          <Eye className="w-3 h-3 text-green-400/60" />
                        )}
                      </div>
                      {course.subtitle && (
                        <p className="text-xs text-cream/50 italic mb-2">{course.subtitle}</p>
                      )}
                      <ul className="space-y-0.5">
                        {items.map((item, i) => {
                          const cat = categories[i]?.trim();
                          return (
                            <li key={i} className="flex items-center gap-2 text-sm text-cream/70">
                              <span className="text-gold/40">·</span>
                              <span>{item}</span>
                              {cat && (
                                <span className="text-xs px-1.5 py-0.5 rounded bg-cream/10 text-cream/50">
                                  {categoryLabels[cat] || cat}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      {(course.wineRed || course.wineWhite) && (
                        <div className="flex gap-4 mt-2 text-xs text-cream/40">
                          {course.wineRed && <span>Rood: {course.wineRed}</span>}
                          {course.wineWhite && <span>Wit: {course.wineWhite}</span>}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleEdit(course)}
                        className="p-1.5 rounded hover:bg-gold/10 text-gold/60 hover:text-gold transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(course)}
                        className="p-1.5 rounded hover:bg-warm-red/10 text-warm-red/60 hover:text-warm-red transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <MenuCardDialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        eventId={eventId}
        course={editingCourse}
        existingCount={Math.max(0, ...courses.map((c) => c.sortOrder), 0)}
        onSave={fetchCourses}
      />
    </div>
  );
}

// =============================================================================
// EVENT DETAIL COMPONENT
// =============================================================================

interface EventDetailProps {
  event: EventWithDetails;
  onRefresh: () => void;
  onEditEvent: () => void;
  onDeleteEvent: () => void;
}

function EventDetail({ event, onRefresh, onEditEvent, onDeleteEvent }: EventDetailProps) {
  const [courseDialogOpen, setCourseDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<EventCourse | null>(null);
  const [menuItemDialogOpen, setMenuItemDialogOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedCourseForItem, setSelectedCourseForItem] = useState<string>('');
  const [shoppingListRefreshTrigger, setShoppingListRefreshTrigger] = useState(0);

  const handleRefreshWithShoppingList = () => {
    onRefresh();
    setShoppingListRefreshTrigger((prev) => prev + 1);
  };

  const handleDeleteEvent = () => {
    if (window.confirm(`Weet je zeker dat je event "${event.name}" wilt verwijderen?`)) {
      fetch(`/api/admin/events/${event.id}`, { method: 'DELETE' })
        .then((res) => {
          if (res.ok) {
            onDeleteEvent();
          } else {
            alert('Fout bij verwijderen event');
          }
        });
    }
  };

  const handleDeleteCourse = (course: EventCourse) => {
    if (window.confirm(`Weet je zeker dat je gang "${course.name}" wilt verwijderen?`)) {
      fetch(`/api/admin/courses/${course.id}`, { method: 'DELETE' })
        .then((res) => {
          if (res.ok) {
            handleRefreshWithShoppingList();
          } else {
            alert('Fout bij verwijderen gang');
          }
        });
    }
  };

  const handleDeleteMenuItem = (item: MenuItem) => {
    if (window.confirm(`Weet je zeker dat je menu-item "${item.name}" wilt verwijderen?`)) {
      fetch(`/api/admin/menu-items/${item.id}`, { method: 'DELETE' })
        .then((res) => {
          if (res.ok) {
            handleRefreshWithShoppingList();
          } else {
            alert('Fout bij verwijderen menu-item');
          }
        });
    }
  };

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setCourseDialogOpen(true);
  };

  const handleEditCourse = (course: EventCourse) => {
    setSelectedCourse(course);
    setCourseDialogOpen(true);
  };

  const handleAddMenuItem = (courseId: string) => {
    setSelectedMenuItem(null);
    setSelectedCourseForItem(courseId);
    setMenuItemDialogOpen(true);
  };

  const handleEditMenuItem = (item: MenuItem) => {
    setSelectedMenuItem(item);
    setSelectedCourseForItem(item.courseId);
    setMenuItemDialogOpen(true);
  };

  const sortedCourses = [...event.courses].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <div>
      {/* Event Info */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle>{event.name}</CardTitle>
              <CardDescription className="mt-2 space-y-1">
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs px-2 py-0.5 rounded bg-gold/20 text-gold border border-gold/30">
                    {eventTypeLabels[event.eventType]}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded ${statusColors[event.status]}`}>
                    {statusLabels[event.status]}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-sm">
                  {event.eventDate && (
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-4 h-4" />
                      {formatDate(event.eventDate)}
                    </span>
                  )}
                  {event.totalPersons && (
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      {event.totalPersons} personen
                    </span>
                  )}
                </div>
                {event.notes && <p className="text-cream/60 text-sm mt-2">{event.notes}</p>}
              </CardDescription>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={onEditEvent}
                className="p-1.5 rounded hover:bg-gold/10 text-gold/60 hover:text-gold transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteEvent}
                className="p-1.5 rounded hover:bg-warm-red/10 text-warm-red/60 hover:text-warm-red transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Courses */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl font-bold text-gold">Gangen</h3>
          <Button size="sm" onClick={handleAddCourse}>
            <Plus className="w-4 h-4 mr-1" />
            Gang toevoegen
          </Button>
        </div>

        {sortedCourses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <UtensilsCrossed className="w-12 h-12 text-cream/30 mx-auto mb-3" />
              <p className="text-cream/60 text-sm">Nog geen gangen toegevoegd</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {sortedCourses.map((course) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <CourseCard
                  course={course}
                  onEditCourse={() => handleEditCourse(course)}
                  onDeleteCourse={() => handleDeleteCourse(course)}
                  onAddMenuItem={() => handleAddMenuItem(course.id)}
                  onEditMenuItem={handleEditMenuItem}
                  onDeleteMenuItem={handleDeleteMenuItem}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Menu Card */}
      <MenuCardSection eventId={event.id} />

      {/* Shopping List */}
      <ShoppingListSection
        eventId={event.id}
        totalPersons={event.totalPersons || 0}
        hasCourses={event.courses.length > 0}
        refreshTrigger={shoppingListRefreshTrigger}
      />

      {/* Purchase Orders Link */}
      <Card className="mt-6">
        <CardContent className="py-4">
          <Link href={`/admin/purchase-orders?eventId=${event.id}`}>
            <Button variant="ghost" className="w-full justify-start">
              <Package className="w-5 h-5 mr-2" />
              Inkooporders beheren
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CourseDialog
        isOpen={courseDialogOpen}
        onClose={() => setCourseDialogOpen(false)}
        eventId={event.id}
        course={selectedCourse}
        existingCount={Math.max(0, ...event.courses.map((c) => c.sortOrder))}
        onSave={handleRefreshWithShoppingList}
      />

      <MenuItemDialog
        isOpen={menuItemDialogOpen}
        onClose={() => setMenuItemDialogOpen(false)}
        courseId={selectedCourseForItem}
        menuItem={selectedMenuItem}
        existingCount={Math.max(
          0,
          ...(event.courses.find((c) => c.id === selectedCourseForItem)?.menuItems.map((i) => i.sortOrder) || [0])
        )}
        onSave={handleRefreshWithShoppingList}
      />
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function AdminMenuPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <AdminMenuContent />
    </AuthGuard>
  );
}

function AdminMenuContent() {
  const [events, setEvents] = useState<EventWithCourseCount[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventWithDetails | null>(null);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<MenuEvent | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoadingList(true);
    try {
      const res = await fetch('/api/admin/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoadingList(false);
    }
  }, []);

  const fetchEventDetail = useCallback(async (eventId: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedEvent(data.event);
      }
    } catch (error) {
      console.error('Error fetching event detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventDetail(selectedEventId);
    }
  }, [selectedEventId, fetchEventDetail]);

  const handleSelectEvent = (eventId: string) => {
    setSelectedEventId(eventId);
  };

  const handleNewEvent = () => {
    setEditingEvent(null);
    setEventDialogOpen(true);
  };

  const handleEditEvent = () => {
    if (selectedEvent) {
      setEditingEvent(selectedEvent);
      setEventDialogOpen(true);
    }
  };

  const handleEventSaved = () => {
    fetchEvents();
    if (selectedEventId) {
      fetchEventDetail(selectedEventId);
    }
  };

  const handleEventDeleted = () => {
    setSelectedEventId(null);
    setSelectedEvent(null);
    fetchEvents();
  };

  const handleRefreshDetail = () => {
    if (selectedEventId) {
      fetchEventDetail(selectedEventId);
    }
  };

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gold mb-2">Menu Beheer</h1>
            <p className="text-cream/60">Beheer events, gangen, menu-items en inkooplijsten</p>
          </div>
          <Link href="/admin">
            <Button variant="ghost">&larr; Terug</Button>
          </Link>
        </div>

        {isLoadingList ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cream/60">Laden...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Event List */}
            <div className="lg:col-span-1">
              <EventList
                events={events}
                selectedEventId={selectedEventId}
                onSelectEvent={handleSelectEvent}
                onNewEvent={handleNewEvent}
              />
            </div>

            {/* Right: Event Detail */}
            <div className="lg:col-span-2">
              {!selectedEventId ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <UtensilsCrossed className="w-16 h-16 text-cream/30 mx-auto mb-4" />
                    <p className="text-cream/60">Selecteer een event om details te bekijken</p>
                  </CardContent>
                </Card>
              ) : isLoadingDetail ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-cream/60">Laden...</p>
                </div>
              ) : selectedEvent ? (
                <EventDetail
                  event={selectedEvent}
                  onRefresh={handleRefreshDetail}
                  onEditEvent={handleEditEvent}
                  onDeleteEvent={handleEventDeleted}
                />
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-warm-red">Event niet gevonden</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Event Dialog */}
      <EventDialog
        isOpen={eventDialogOpen}
        onClose={() => setEventDialogOpen(false)}
        event={editingEvent}
        onSave={handleEventSaved}
      />
    </main>
  );
}
