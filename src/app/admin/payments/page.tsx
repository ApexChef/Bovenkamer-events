'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/AuthGuard';

interface PaymentSettings {
  id?: string;
  amount_cents: number;
  amount_partner_cents: number;
  description: string;
  deadline: string | null;
  tikkie_enabled: boolean;
  auto_reminder_days: number;
}

interface PaymentRequest {
  id: string;
  user_id: string;
  amount_cents: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled';
  tikkie_url: string | null;
  paid_at: string | null;
  created_at: string;
  reminder_count: number;
  users?: {
    name: string;
    email: string;
  };
  registrations?: {
    has_partner: boolean;
    partner_name: string | null;
  };
}

interface PaymentStats {
  total: number;
  paid: number;
  pending: number;
  expired: number;
  totalExpected: number;
  totalReceived: number;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Openstaand', color: 'text-yellow-500' },
  paid: { label: 'Betaald', color: 'text-success-green' },
  expired: { label: 'Verlopen', color: 'text-warm-red' },
  cancelled: { label: 'Geannuleerd', color: 'text-cream/50' },
};

function formatCentsToEuros(cents: number): string {
  return new Intl.NumberFormat('nl-NL', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100);
}

export default function AdminPaymentsPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <AdminPaymentsContent />
    </AuthGuard>
  );
}

function AdminPaymentsContent() {
  const [activeTab, setActiveTab] = useState<'overview' | 'settings'>('overview');
  const [settings, setSettings] = useState<PaymentSettings>({
    amount_cents: 5000,
    amount_partner_cents: 4000,
    description: 'Deelname Bovenkamer Winterproef 2026',
    deadline: null,
    tikkie_enabled: true,
    auto_reminder_days: 3,
  });
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch settings and payments
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settingsRes, paymentsRes] = await Promise.all([
          fetch('/api/payments/settings'),
          fetch('/api/payments'),
        ]);

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json();
          setSettings(settingsData);
        }

        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json();
          setPayments(paymentsData.payments || []);
          setStats(paymentsData.stats || null);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Save settings
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/payments/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Kon instellingen niet opslaan');

      const data = await response.json();
      setSettings(data);
      setMessage({ type: 'success', text: 'Instellingen opgeslagen!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Kon instellingen niet opslaan' });
    } finally {
      setIsSaving(false);
    }
  };

  // Send reminder
  const handleSendReminder = async (paymentRequestId?: string) => {
    setSendingReminder(paymentRequestId || 'all');
    setMessage(null);

    try {
      const body = paymentRequestId
        ? { payment_request_id: paymentRequestId }
        : { send_to_all_pending: true };

      const response = await fetch('/api/payments/reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Kon herinnering niet versturen');

      setMessage({ type: 'success', text: data.message });

      // Refresh payments
      const paymentsRes = await fetch('/api/payments');
      if (paymentsRes.ok) {
        const paymentsData = await paymentsRes.json();
        setPayments(paymentsData.payments || []);
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      setMessage({ type: 'error', text: 'Kon herinnering niet versturen' });
    } finally {
      setSendingReminder(null);
    }
  };

  const pendingPayments = payments.filter((p) => p.status === 'pending');

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gold mb-2">
              Betalingen
            </h1>
            <p className="text-cream/60">Beheer betaalverzoeken en instellingen</p>
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
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === 'overview' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('overview')}
          >
            Overzicht
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'primary' : 'ghost'}
            onClick={() => setActiveTab('settings')}
          >
            Instellingen
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
            <p className="text-cream/60">Laden...</p>
          </div>
        ) : activeTab === 'overview' ? (
          <>
            {/* Stats */}
            {stats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                  <Card>
                    <CardContent className="py-4 text-center">
                      <p className="text-3xl font-bold text-gold">{stats.total}</p>
                      <p className="text-cream/60 text-sm">Verzoeken</p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Card>
                    <CardContent className="py-4 text-center">
                      <p className="text-3xl font-bold text-success-green">{stats.paid}</p>
                      <p className="text-cream/60 text-sm">Betaald</p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <Card>
                    <CardContent className="py-4 text-center">
                      <p className="text-3xl font-bold text-yellow-500">{stats.pending}</p>
                      <p className="text-cream/60 text-sm">Openstaand</p>
                    </CardContent>
                  </Card>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                  <Card>
                    <CardContent className="py-4 text-center">
                      <p className="text-3xl font-bold text-gold">
                        {formatCentsToEuros(stats.totalReceived)}
                      </p>
                      <p className="text-cream/60 text-sm">
                        van {formatCentsToEuros(stats.totalExpected)}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            )}

            {/* Progress bar */}
            {stats && stats.totalExpected > 0 && (
              <div className="mb-8">
                <div className="flex justify-between text-sm text-cream/60 mb-2">
                  <span>Voortgang</span>
                  <span>{Math.round((stats.totalReceived / stats.totalExpected) * 100)}%</span>
                </div>
                <div className="h-3 bg-dark-wood/50 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-gold to-success-green"
                    initial={{ width: 0 }}
                    animate={{ width: `${(stats.totalReceived / stats.totalExpected) * 100}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            )}

            {/* Bulk reminder button */}
            {pendingPayments.length > 0 && (
              <div className="mb-6">
                <Button
                  onClick={() => handleSendReminder()}
                  disabled={sendingReminder === 'all'}
                >
                  {sendingReminder === 'all' ? 'Versturen...' : `Herinner alle (${pendingPayments.length})`}
                </Button>
              </div>
            )}

            {/* Payments List */}
            <Card>
              <CardHeader>
                <CardTitle>Betaalverzoeken</CardTitle>
                <CardDescription>Alle betalingen voor het event</CardDescription>
              </CardHeader>
              <CardContent>
                {payments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-cream/60 mb-2">Nog geen betaalverzoeken</p>
                    <p className="text-cream/40 text-sm">
                      Betaalverzoeken worden automatisch aangemaakt bij registratie.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {payments.map((payment, index) => (
                      <motion.div
                        key={payment.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="flex items-center justify-between p-4 bg-dark-wood/30 rounded-lg border border-gold/20"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <span className={STATUS_LABELS[payment.status]?.color || 'text-cream'}>
                              {payment.status === 'paid' ? '✓' : payment.status === 'expired' ? '✗' : '○'}
                            </span>
                            <span className="text-gold font-semibold">
                              {payment.users?.name || 'Onbekend'}
                            </span>
                            <span className="text-cream/60 text-sm">
                              {formatCentsToEuros(payment.amount_cents)}
                            </span>
                            {payment.registrations?.has_partner && (
                              <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded">
                                +partner
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-cream/50">
                            <span className={STATUS_LABELS[payment.status]?.color}>
                              {STATUS_LABELS[payment.status]?.label}
                            </span>
                            {payment.paid_at && (
                              <span>
                                {new Date(payment.paid_at).toLocaleDateString('nl-NL')}
                              </span>
                            )}
                            {payment.reminder_count > 0 && (
                              <span className="text-yellow-500">
                                {payment.reminder_count}x herinnerd
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {payment.tikkie_url && (
                            <a
                              href={payment.tikkie_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-gold hover:text-gold/80 text-sm"
                            >
                              Tikkie
                            </a>
                          )}
                          {payment.status === 'pending' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendReminder(payment.id)}
                              disabled={sendingReminder === payment.id}
                            >
                              {sendingReminder === payment.id ? '...' : 'Herinner'}
                            </Button>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        ) : (
          /* Settings Tab */
          <Card>
            <CardHeader>
              <CardTitle>Betaalinstellingen</CardTitle>
              <CardDescription>Configureer bedragen en opties</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Amount */}
                <div>
                  <label className="block text-cream/70 text-sm mb-2">
                    Bedrag per persoon
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-cream/50">&euro;</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(settings.amount_cents / 100).toFixed(2)}
                      onChange={(e) =>
                        setSettings({ ...settings, amount_cents: Math.round(parseFloat(e.target.value) * 100) || 0 })
                      }
                      className="bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none w-32"
                    />
                  </div>
                </div>

                {/* Partner Amount */}
                <div>
                  <label className="block text-cream/70 text-sm mb-2">
                    Bedrag partner (extra)
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-cream/50">&euro;</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={(settings.amount_partner_cents / 100).toFixed(2)}
                      onChange={(e) =>
                        setSettings({ ...settings, amount_partner_cents: Math.round(parseFloat(e.target.value) * 100) || 0 })
                      }
                      className="bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none w-32"
                    />
                  </div>
                  <p className="text-cream/40 text-xs mt-1">
                    Totaal met partner: {formatCentsToEuros(settings.amount_cents + settings.amount_partner_cents)}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-cream/70 text-sm mb-2">
                    Beschrijving betaalverzoek
                  </label>
                  <input
                    type="text"
                    value={settings.description}
                    onChange={(e) => setSettings({ ...settings, description: e.target.value })}
                    className="w-full bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none"
                    placeholder="Deelname Bovenkamer Winterproef 2026"
                  />
                </div>

                {/* Deadline */}
                <div>
                  <label className="block text-cream/70 text-sm mb-2">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={settings.deadline || ''}
                    onChange={(e) => setSettings({ ...settings, deadline: e.target.value || null })}
                    className="bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none"
                  />
                </div>

                {/* Auto Reminder */}
                <div>
                  <label className="block text-cream/70 text-sm mb-2">
                    Automatische herinnering na (dagen)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    value={settings.auto_reminder_days}
                    onChange={(e) =>
                      setSettings({ ...settings, auto_reminder_days: parseInt(e.target.value) || 0 })
                    }
                    className="bg-dark-wood/50 border border-gold/30 rounded-lg px-4 py-2 text-cream focus:border-gold focus:outline-none w-24"
                  />
                  <p className="text-cream/40 text-xs mt-1">
                    0 = geen automatische herinnering
                  </p>
                </div>

                {/* Tikkie Toggle */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="tikkie_enabled"
                    checked={settings.tikkie_enabled}
                    onChange={(e) => setSettings({ ...settings, tikkie_enabled: e.target.checked })}
                    className="w-5 h-5 rounded border-gold/30 bg-dark-wood/50 text-gold focus:ring-gold"
                  />
                  <label htmlFor="tikkie_enabled" className="text-cream/70">
                    Tikkie integratie ingeschakeld
                  </label>
                </div>

                {/* Save Button */}
                <div className="pt-4 border-t border-gold/10">
                  <Button onClick={handleSaveSettings} disabled={isSaving}>
                    {isSaving ? 'Opslaan...' : 'Instellingen Opslaan'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
}
