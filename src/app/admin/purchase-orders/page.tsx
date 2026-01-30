'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/AuthGuard';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, Input, Select, TextArea } from '@/components/ui';
import Link from 'next/link';
import { Plus, Pencil, Trash2, ChevronRight, Package, ArrowLeft } from 'lucide-react';
import type {
  PurchaseOrderSummary,
  PurchaseOrderWithLines,
  PurchaseOrderLineWithMenuItem,
  PurchaseOrderStatus,
  POLineCategory,
  CreatePurchaseOrderData,
  CreatePOLineData,
  EventCourseWithItems,
  MenuItem,
} from '@/types';

// =============================================================================
// LABELS & CONSTANTS
// =============================================================================

const statusLabels: Record<PurchaseOrderStatus, string> = {
  draft: 'Concept',
  ordered: 'Besteld',
  received: 'Ontvangen',
  invoiced: 'Gefactureerd',
};

const statusColors: Record<PurchaseOrderStatus, string> = {
  draft: 'bg-gray-500/20 text-gray-300',
  ordered: 'bg-blue-500/20 text-blue-300',
  received: 'bg-green-500/20 text-green-300',
  invoiced: 'bg-gold/20 text-gold',
};

const categoryLabels: Record<POLineCategory, string> = {
  food: 'Voedsel',
  drink: 'Dranken',
  condiment: 'Sauzen & Kruiderijen',
  herb: 'Kruiden',
  non_food: 'Non-food',
  other: 'Overig',
};

const categoryColors: Record<POLineCategory, string> = {
  food: 'bg-green-500/20 text-green-300',
  drink: 'bg-blue-500/20 text-blue-300',
  condiment: 'bg-orange-500/20 text-orange-300',
  herb: 'bg-emerald-500/20 text-emerald-300',
  non_food: 'bg-purple-500/20 text-purple-300',
  other: 'bg-gray-500/20 text-gray-300',
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function formatDate(dateString: string | null): string {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function formatPrice(price: number | null): string {
  if (price === null) return '-';
  return new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(price);
}

function formatQuantity(qty: number | null, unit: string | null): string {
  if (qty === null) return '-';
  const formatted = Number.isInteger(qty) ? qty.toString() : qty.toFixed(2);
  return unit ? `${formatted} ${unit}` : formatted;
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
// PO STATUS BADGE
// =============================================================================

function POStatusBadge({ status }: { status: PurchaseOrderStatus }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${statusColors[status]}`}>
      {statusLabels[status]}
    </span>
  );
}

// =============================================================================
// PURCHASE ORDER DIALOG
// =============================================================================

interface PODialogProps {
  isOpen: boolean;
  onClose: () => void;
  eventId: string;
  purchaseOrder: PurchaseOrderSummary | null;
  onSave: () => void;
}

function PODialog({ isOpen, onClose, eventId, purchaseOrder, onSave }: PODialogProps) {
  const [formData, setFormData] = useState<CreatePurchaseOrderData>({
    supplier: '',
    orderDate: null,
    expectedDeliveryDate: null,
    status: 'draft',
    invoiceReference: '',
    invoiceDate: null,
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (purchaseOrder) {
      setFormData({
        supplier: purchaseOrder.supplier,
        orderDate: purchaseOrder.orderDate,
        expectedDeliveryDate: purchaseOrder.expectedDeliveryDate,
        status: purchaseOrder.status,
        invoiceReference: purchaseOrder.invoiceReference || '',
        invoiceDate: purchaseOrder.invoiceDate,
        notes: purchaseOrder.notes || '',
      });
    } else {
      setFormData({
        supplier: '',
        orderDate: null,
        expectedDeliveryDate: null,
        status: 'draft',
        invoiceReference: '',
        invoiceDate: null,
        notes: '',
      });
    }
    setError('');
  }, [purchaseOrder, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const url = purchaseOrder
        ? `/api/admin/purchase-orders/${purchaseOrder.id}`
        : '/api/admin/purchase-orders';
      const method = purchaseOrder ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, eventId }),
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
    <Modal isOpen={isOpen} onClose={onClose} title={purchaseOrder ? 'Inkooporder bewerken' : 'Nieuwe inkooporder'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-warm-red/10 border border-warm-red/30 rounded-lg p-4">
            <p className="text-warm-red text-sm">{error}</p>
          </div>
        )}

        <Input
          label="Leverancier"
          value={formData.supplier}
          onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
          placeholder="Bijv. HANOS, Sligro"
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Besteldatum"
            type="date"
            value={formData.orderDate || ''}
            onChange={(e) => setFormData({ ...formData, orderDate: e.target.value || null })}
          />
          <Input
            label="Verwachte levering"
            type="date"
            value={formData.expectedDeliveryDate || ''}
            onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value || null })}
          />
        </div>

        <Select
          label="Status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as PurchaseOrderStatus })}
          options={[
            { value: 'draft', label: 'Concept' },
            { value: 'ordered', label: 'Besteld' },
            { value: 'received', label: 'Ontvangen' },
            { value: 'invoiced', label: 'Gefactureerd' },
          ]}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Factuurnummer"
            value={formData.invoiceReference}
            onChange={(e) => setFormData({ ...formData, invoiceReference: e.target.value })}
            placeholder="Bijv. 925956726"
          />
          <Input
            label="Factuurdatum"
            type="date"
            value={formData.invoiceDate || ''}
            onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value || null })}
          />
        </div>

        <TextArea
          label="Notities"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={3}
        />

        <div className="flex gap-3 pt-4">
          <Button type="submit" isLoading={isSaving}>
            {purchaseOrder ? 'Bijwerken' : 'Aanmaken'}
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
// PO LINE DIALOG
// =============================================================================

interface POLineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrderId: string;
  line: PurchaseOrderLineWithMenuItem | null;
  menuItems: Array<{ id: string; name: string; courseName: string }>;
  onSave: () => void;
}

function POLineDialog({ isOpen, onClose, purchaseOrderId, line, menuItems, onSave }: POLineDialogProps) {
  const [formData, setFormData] = useState<CreatePOLineData>({
    menuItemId: null,
    name: '',
    description: '',
    lineCategory: 'food',
    orderedQuantity: null,
    receivedQuantity: null,
    unitLabel: '',
    unitPrice: null,
    totalPrice: null,
    supplierArticleNr: '',
    notes: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (line) {
      setFormData({
        menuItemId: line.menuItemId,
        name: line.name,
        description: line.description || '',
        lineCategory: line.lineCategory,
        orderedQuantity: line.orderedQuantity,
        receivedQuantity: line.receivedQuantity,
        unitLabel: line.unitLabel || '',
        unitPrice: line.unitPrice,
        totalPrice: line.totalPrice,
        supplierArticleNr: line.supplierArticleNr || '',
        notes: line.notes || '',
      });
    } else {
      setFormData({
        menuItemId: null,
        name: '',
        description: '',
        lineCategory: 'food',
        orderedQuantity: null,
        receivedQuantity: null,
        unitLabel: '',
        unitPrice: null,
        totalPrice: null,
        supplierArticleNr: '',
        notes: '',
      });
    }
    setError('');
  }, [line, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSaving(true);

    try {
      const url = line
        ? `/api/admin/po-lines/${line.id}`
        : `/api/admin/purchase-orders/${purchaseOrderId}/lines`;
      const method = line ? 'PATCH' : 'POST';

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

  // Group menu items by course
  const menuItemsByCourse = menuItems.reduce<Record<string, typeof menuItems>>((acc, item) => {
    if (!acc[item.courseName]) acc[item.courseName] = [];
    acc[item.courseName].push(item);
    return acc;
  }, {});

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={line ? 'Orderregel bewerken' : 'Orderregel toevoegen'}>
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
          placeholder="Bijv. Picanha, BBQ Sauce"
          required
        />

        <TextArea
          label="Omschrijving"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={2}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Categorie"
            value={formData.lineCategory}
            onChange={(e) => setFormData({ ...formData, lineCategory: e.target.value as POLineCategory })}
            options={[
              { value: 'food', label: 'Voedsel' },
              { value: 'drink', label: 'Dranken' },
              { value: 'condiment', label: 'Sauzen & Kruiderijen' },
              { value: 'herb', label: 'Kruiden' },
              { value: 'non_food', label: 'Non-food' },
              { value: 'other', label: 'Overig' },
            ]}
          />

          <div>
            <label className="block text-sm font-medium text-cream/80 mb-1">Menu-item koppeling</label>
            <select
              className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-3 py-2 text-cream text-sm focus:outline-none focus:ring-2 focus:ring-gold/50"
              value={formData.menuItemId || ''}
              onChange={(e) => setFormData({ ...formData, menuItemId: e.target.value || null })}
            >
              <option value="">Geen koppeling</option>
              {Object.entries(menuItemsByCourse).map(([courseName, items]) => (
                <optgroup key={courseName} label={courseName}>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Besteld"
            type="number"
            step="0.01"
            value={formData.orderedQuantity?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, orderedQuantity: e.target.value ? parseFloat(e.target.value) : null })}
          />
          <Input
            label="Ontvangen"
            type="number"
            step="0.01"
            value={formData.receivedQuantity?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, receivedQuantity: e.target.value ? parseFloat(e.target.value) : null })}
          />
          <Input
            label="Eenheid"
            value={formData.unitLabel}
            onChange={(e) => setFormData({ ...formData, unitLabel: e.target.value })}
            placeholder="g, kg, st, fl"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Stukprijs"
            type="number"
            step="0.01"
            value={formData.unitPrice?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value ? parseFloat(e.target.value) : null })}
          />
          <Input
            label="Totaalprijs"
            type="number"
            step="0.01"
            value={formData.totalPrice?.toString() || ''}
            onChange={(e) => setFormData({ ...formData, totalPrice: e.target.value ? parseFloat(e.target.value) : null })}
          />
          <Input
            label="Artikelnr."
            value={formData.supplierArticleNr}
            onChange={(e) => setFormData({ ...formData, supplierArticleNr: e.target.value })}
            placeholder="Bijv. 30312050"
          />
        </div>

        <TextArea
          label="Notities"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          rows={2}
        />

        <div className="flex gap-3 pt-4">
          <Button type="submit" isLoading={isSaving}>
            {line ? 'Bijwerken' : 'Toevoegen'}
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
// PO LIST COMPONENT
// =============================================================================

interface POListProps {
  orders: PurchaseOrderSummary[];
  selectedOrderId: string | null;
  onSelectOrder: (id: string) => void;
  onNewOrder: () => void;
}

function POList({ orders, selectedOrderId, onSelectOrder, onNewOrder }: POListProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-xl font-bold text-gold">Inkooporders</h2>
        <Button size="sm" onClick={onNewOrder}>
          <Plus className="w-4 h-4 mr-1" />
          Nieuwe Order
        </Button>
      </div>

      <div className="space-y-2">
        {orders.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Package className="w-12 h-12 text-cream/30 mx-auto mb-3" />
              <p className="text-cream/60 text-sm">Geen inkooporders</p>
            </CardContent>
          </Card>
        ) : (
          orders.map((order) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card
                className={`cursor-pointer transition-all ${
                  selectedOrderId === order.id ? 'ring-2 ring-gold' : 'hover:border-gold/40'
                }`}
                onClick={() => onSelectOrder(order.id)}
              >
                <CardContent className="py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-cream truncate">{order.supplier}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <POStatusBadge status={order.status} />
                        {order.invoiceReference && (
                          <span className="text-xs px-2 py-0.5 rounded bg-cream/10 text-cream/70">
                            #{order.invoiceReference}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2 text-xs text-cream/60">
                        <span>{order.lineCount} {order.lineCount === 1 ? 'regel' : 'regels'}</span>
                        {order.totalPrice !== null && (
                          <span>{formatPrice(order.totalPrice)}</span>
                        )}
                        {order.orderDate && (
                          <span>{formatDate(order.orderDate)}</span>
                        )}
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
// PO LINE TABLE
// =============================================================================

interface POLineTableProps {
  lines: PurchaseOrderLineWithMenuItem[];
  onEditLine: (line: PurchaseOrderLineWithMenuItem) => void;
  onDeleteLine: (line: PurchaseOrderLineWithMenuItem) => void;
}

function POLineTable({ lines, onEditLine, onDeleteLine }: POLineTableProps) {
  if (lines.length === 0) {
    return (
      <p className="text-cream/60 text-sm text-center py-8">Nog geen orderregels</p>
    );
  }

  const totalAmount = lines.reduce((sum, l) => sum + (l.totalPrice || 0), 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gold/20">
            <th className="text-left py-2 px-2 text-gold/70 font-normal text-xs">Item</th>
            <th className="text-center py-2 px-2 text-gold/70 font-normal text-xs">Categorie</th>
            <th className="text-right py-2 px-2 text-gold/70 font-normal text-xs">Besteld</th>
            <th className="text-right py-2 px-2 text-gold/70 font-normal text-xs">Ontvangen</th>
            <th className="text-right py-2 px-2 text-gold/70 font-normal text-xs">Eenheid</th>
            <th className="text-right py-2 px-2 text-gold/70 font-normal text-xs">Prijs</th>
            <th className="text-right py-2 px-2 text-gold/70 font-normal text-xs">Totaal</th>
            <th className="text-center py-2 px-2 text-gold/70 font-normal text-xs">Menu</th>
            <th className="text-right py-2 px-2 text-gold/70 font-normal text-xs"></th>
          </tr>
        </thead>
        <tbody>
          {lines.map((line) => (
            <tr key={line.id} className="border-b border-gold/10">
              <td className="py-2 px-2 text-cream">
                <div>{line.name}</div>
                {line.supplierArticleNr && (
                  <div className="text-xs text-cream/40">#{line.supplierArticleNr}</div>
                )}
              </td>
              <td className="text-center py-2 px-2">
                <span className={`text-xs px-2 py-0.5 rounded ${categoryColors[line.lineCategory]}`}>
                  {categoryLabels[line.lineCategory]}
                </span>
              </td>
              <td className="text-right py-2 px-2 text-cream/70">
                {formatQuantity(line.orderedQuantity, null)}
              </td>
              <td className="text-right py-2 px-2 text-cream/70">
                {formatQuantity(line.receivedQuantity, null)}
              </td>
              <td className="text-right py-2 px-2 text-cream/50">
                {line.unitLabel || '-'}
              </td>
              <td className="text-right py-2 px-2 text-cream/70">
                {formatPrice(line.unitPrice)}
              </td>
              <td className="text-right py-2 px-2 text-cream font-medium">
                {formatPrice(line.totalPrice)}
              </td>
              <td className="text-center py-2 px-2">
                {line.menuItemName ? (
                  <span className="text-xs px-2 py-0.5 rounded bg-gold/10 text-gold/80" title={line.menuItemCourse || ''}>
                    {line.menuItemName}
                  </span>
                ) : (
                  <span className="text-cream/30 text-xs">-</span>
                )}
              </td>
              <td className="text-right py-2 px-2">
                <div className="flex gap-1 justify-end">
                  <button
                    onClick={() => onEditLine(line)}
                    className="p-1 rounded hover:bg-gold/10 text-gold/60 hover:text-gold transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteLine(line)}
                    className="p-1 rounded hover:bg-warm-red/10 text-warm-red/60 hover:text-warm-red transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
          <tr className="border-t-2 border-gold/30 font-semibold">
            <td className="py-2 px-2 text-gold" colSpan={6}>Totaal</td>
            <td className="text-right py-2 px-2 text-gold">{formatPrice(totalAmount)}</td>
            <td colSpan={2}></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// =============================================================================
// PO DETAIL COMPONENT
// =============================================================================

interface PODetailProps {
  order: PurchaseOrderWithLines;
  menuItems: Array<{ id: string; name: string; courseName: string }>;
  onRefresh: () => void;
  onEditOrder: () => void;
  onDeleteOrder: () => void;
}

function PODetail({ order, menuItems, onRefresh, onEditOrder, onDeleteOrder }: PODetailProps) {
  const [lineDialogOpen, setLineDialogOpen] = useState(false);
  const [selectedLine, setSelectedLine] = useState<PurchaseOrderLineWithMenuItem | null>(null);

  const handleDeleteOrder = () => {
    if (window.confirm(`Weet je zeker dat je inkooporder van "${order.supplier}" wilt verwijderen?`)) {
      fetch(`/api/admin/purchase-orders/${order.id}`, { method: 'DELETE' })
        .then((res) => {
          if (res.ok) {
            onDeleteOrder();
          } else {
            alert('Fout bij verwijderen inkooporder');
          }
        });
    }
  };

  const handleDeleteLine = (line: PurchaseOrderLineWithMenuItem) => {
    if (window.confirm(`Weet je zeker dat je regel "${line.name}" wilt verwijderen?`)) {
      fetch(`/api/admin/po-lines/${line.id}`, { method: 'DELETE' })
        .then((res) => {
          if (res.ok) {
            onRefresh();
          } else {
            alert('Fout bij verwijderen orderregel');
          }
        });
    }
  };

  const handleAddLine = () => {
    setSelectedLine(null);
    setLineDialogOpen(true);
  };

  const handleEditLine = (line: PurchaseOrderLineWithMenuItem) => {
    setSelectedLine(line);
    setLineDialogOpen(true);
  };

  return (
    <div>
      {/* Order Header */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <CardTitle>{order.supplier}</CardTitle>
              <CardDescription className="mt-2 space-y-2">
                <div className="flex flex-wrap gap-2">
                  <POStatusBadge status={order.status} />
                  {order.invoiceReference && (
                    <span className="text-xs px-2 py-0.5 rounded bg-cream/10 text-cream/70">
                      Factuur: {order.invoiceReference}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-cream/60">
                  {order.orderDate && <span>Besteld: {formatDate(order.orderDate)}</span>}
                  {order.invoiceDate && <span>Factuur: {formatDate(order.invoiceDate)}</span>}
                  {order.expectedDeliveryDate && <span>Verwacht: {formatDate(order.expectedDeliveryDate)}</span>}
                </div>
                {order.notes && <p className="text-cream/50 text-sm">{order.notes}</p>}
              </CardDescription>
            </div>
            <div className="flex gap-1 flex-shrink-0">
              <button
                onClick={onEditOrder}
                className="p-1.5 rounded hover:bg-gold/10 text-gold/60 hover:text-gold transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={handleDeleteOrder}
                className="p-1.5 rounded hover:bg-warm-red/10 text-warm-red/60 hover:text-warm-red transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Lines */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orderregels ({order.lines.length})</CardTitle>
            <Button size="sm" onClick={handleAddLine}>
              <Plus className="w-4 h-4 mr-1" />
              Regel toevoegen
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <POLineTable
            lines={order.lines}
            onEditLine={handleEditLine}
            onDeleteLine={handleDeleteLine}
          />
        </CardContent>
      </Card>

      {/* Line Dialog */}
      <POLineDialog
        isOpen={lineDialogOpen}
        onClose={() => setLineDialogOpen(false)}
        purchaseOrderId={order.id}
        line={selectedLine}
        menuItems={menuItems}
        onSave={onRefresh}
      />
    </div>
  );
}

// =============================================================================
// MAIN PAGE
// =============================================================================

export default function AdminPurchaseOrdersPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <PurchaseOrdersContent />
    </AuthGuard>
  );
}

function PurchaseOrdersContent() {
  const searchParams = useSearchParams();
  const eventId = searchParams.get('eventId');

  const [orders, setOrders] = useState<PurchaseOrderSummary[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrderWithLines | null>(null);
  const [menuItems, setMenuItems] = useState<Array<{ id: string; name: string; courseName: string }>>([]);
  const [eventName, setEventName] = useState<string>('');
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [poDialogOpen, setPODialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<PurchaseOrderSummary | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!eventId) return;
    setIsLoadingList(true);
    try {
      const res = await fetch(`/api/admin/purchase-orders?eventId=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setOrders(data.purchaseOrders || []);
      }
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
    } finally {
      setIsLoadingList(false);
    }
  }, [eventId]);

  const fetchOrderDetail = useCallback(async (orderId: string) => {
    setIsLoadingDetail(true);
    try {
      const res = await fetch(`/api/admin/purchase-orders/${orderId}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedOrder(data.purchaseOrder);
      }
    } catch (error) {
      console.error('Error fetching PO detail:', error);
    } finally {
      setIsLoadingDetail(false);
    }
  }, []);

  const fetchMenuItems = useCallback(async () => {
    if (!eventId) return;
    try {
      const res = await fetch(`/api/admin/events/${eventId}`);
      if (res.ok) {
        const data = await res.json();
        const event = data.event;
        setEventName(event?.name || '');
        const items: Array<{ id: string; name: string; courseName: string }> = [];
        for (const course of event?.courses || []) {
          for (const item of course.menuItems || []) {
            items.push({
              id: item.id,
              name: item.name,
              courseName: course.name,
            });
          }
        }
        setMenuItems(items);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    }
  }, [eventId]);

  useEffect(() => {
    fetchOrders();
    fetchMenuItems();
  }, [fetchOrders, fetchMenuItems]);

  useEffect(() => {
    if (selectedOrderId) {
      fetchOrderDetail(selectedOrderId);
    }
  }, [selectedOrderId, fetchOrderDetail]);

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrderId(orderId);
  };

  const handleNewOrder = () => {
    setEditingOrder(null);
    setPODialogOpen(true);
  };

  const handleEditOrder = () => {
    if (selectedOrder) {
      const summary = orders.find((o) => o.id === selectedOrder.id);
      if (summary) {
        setEditingOrder(summary);
        setPODialogOpen(true);
      }
    }
  };

  const handleOrderSaved = () => {
    fetchOrders();
    if (selectedOrderId) {
      fetchOrderDetail(selectedOrderId);
    }
  };

  const handleOrderDeleted = () => {
    setSelectedOrderId(null);
    setSelectedOrder(null);
    fetchOrders();
  };

  const handleRefreshDetail = () => {
    if (selectedOrderId) {
      fetchOrderDetail(selectedOrderId);
    }
    fetchOrders();
  };

  if (!eventId) {
    return (
      <main className="min-h-screen py-8 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <Package className="w-16 h-16 text-cream/30 mx-auto mb-4" />
          <h1 className="font-display text-3xl font-bold text-gold mb-4">Inkooporders</h1>
          <p className="text-cream/60 mb-6">Selecteer eerst een event in het Menu Beheer</p>
          <Link href="/admin/menu">
            <Button>Naar Menu Beheer</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gold mb-2">Inkooporders</h1>
            {eventName && <p className="text-cream/60">{eventName}</p>}
          </div>
          <Link href="/admin/menu">
            <Button variant="ghost">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Terug naar Menu
            </Button>
          </Link>
        </div>

        {isLoadingList ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cream/60">Laden...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: PO List */}
            <div className="lg:col-span-1">
              <POList
                orders={orders}
                selectedOrderId={selectedOrderId}
                onSelectOrder={handleSelectOrder}
                onNewOrder={handleNewOrder}
              />
            </div>

            {/* Right: PO Detail */}
            <div className="lg:col-span-2">
              {!selectedOrderId ? (
                <Card>
                  <CardContent className="py-16 text-center">
                    <Package className="w-16 h-16 text-cream/30 mx-auto mb-4" />
                    <p className="text-cream/60">Selecteer een inkooporder om details te bekijken</p>
                  </CardContent>
                </Card>
              ) : isLoadingDetail ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-cream/60">Laden...</p>
                </div>
              ) : selectedOrder ? (
                <PODetail
                  order={selectedOrder}
                  menuItems={menuItems}
                  onRefresh={handleRefreshDetail}
                  onEditOrder={handleEditOrder}
                  onDeleteOrder={handleOrderDeleted}
                />
              ) : (
                <Card>
                  <CardContent className="py-16 text-center">
                    <p className="text-warm-red">Inkooporder niet gevonden</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PO Dialog */}
      {eventId && (
        <PODialog
          isOpen={poDialogOpen}
          onClose={() => setPODialogOpen(false)}
          eventId={eventId}
          purchaseOrder={editingOrder}
          onSave={handleOrderSaved}
        />
      )}
    </main>
  );
}
