'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/AuthGuard';
import { FeatureKey } from '@/types';

interface Registration {
  id: string;
  user_id: string;
  birth_year: number;
  has_partner: boolean;
  partner_name: string | null;
  dietary_requirements: string | null;
  primary_skill: string;
  music_decade: string;
  music_genre: string;
  ai_assignment: {
    officialTitle: string;
    task: string;
    warningLevel: string;
  } | null;
  predictions: Record<string, unknown> | null;
  created_at: string;
  users: {
    id: string;
    name: string;
    email: string;
  };
}

const SKILL_LABELS: Record<string, string> = {
  cooking: 'Koken',
  bbq: 'BBQ-en',
  wine: 'Wijn selecteren',
  beer: 'Bier tappen',
  dishes: 'Afwassen',
  fire: 'Vuur maken',
  dj: 'DJ-en',
  talking: 'Gesprekken leiden',
  nothing: 'Niks',
  organizing: 'Organiseren',
  photos: "Foto's maken",
};

const WARNING_COLORS: Record<string, string> = {
  GROEN: 'bg-success-green',
  GEEL: 'bg-yellow-500',
  ORANJE: 'bg-orange-500',
  ROOD: 'bg-warm-red',
};

export default function AdminPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <AdminPageContent />
    </AuthGuard>
  );
}

interface FeatureToggle {
  feature_key: FeatureKey;
  is_enabled: boolean;
  description: string;
  updated_at: string | null;
  updated_by: string | null;
}

const FEATURE_LABELS: Record<FeatureKey, string> = {
  show_countdown: 'Afteltimer',
  show_ai_assignment: 'AI Taaktoewijzing',
  show_leaderboard_preview: 'Mini Leaderboard',
  show_burger_game: 'Burger Stack Game',
  show_predictions: 'Voorspellingen',
};

function AdminPageContent() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<FeatureToggle[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [togglingFeature, setTogglingFeature] = useState<string | null>(null);

  useEffect(() => {
    const fetchRegistrations = async () => {
      try {
        const response = await fetch('/api/registration');
        if (!response.ok) {
          throw new Error('Kon registraties niet ophalen');
        }
        const data = await response.json();
        setRegistrations(data);
      } catch (err) {
        console.error('Error fetching registrations:', err);
        setError('Kon registraties niet ophalen. Is de database geconfigureerd?');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRegistrations();
  }, []);

  // Fetch feature toggles
  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const response = await fetch('/api/admin/features');
        if (response.ok) {
          const data = await response.json();
          setFeatures(data.features || []);
        }
      } catch (err) {
        console.error('Error fetching features:', err);
      } finally {
        setFeaturesLoading(false);
      }
    };
    fetchFeatures();
  }, []);

  // Toggle a feature
  const toggleFeature = async (featureKey: FeatureKey, currentValue: boolean) => {
    setTogglingFeature(featureKey);
    try {
      const response = await fetch('/api/admin/features', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          feature_key: featureKey,
          is_enabled: !currentValue,
        }),
      });
      if (response.ok) {
        setFeatures(prev =>
          prev.map(f =>
            f.feature_key === featureKey ? { ...f, is_enabled: !currentValue } : f
          )
        );
      }
    } catch (err) {
      console.error('Error toggling feature:', err);
    } finally {
      setTogglingFeature(null);
    }
  };

  const stats = {
    total: registrations.length,
    withPartner: registrations.filter((r) => r.has_partner).length,
    withPredictions: registrations.filter((r) => r.predictions && Object.keys(r.predictions).length > 0).length,
    totalPersons: registrations.reduce((acc, r) => acc + (r.has_partner ? 2 : 1), 0),
  };

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-gold mb-2">
              Admin Dashboard
            </h1>
            <p className="text-cream/60">Beheer registraties en bekijk statistieken</p>
          </div>
          <Link href="/">
            <Button variant="ghost">← Terug</Button>
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold text-gold">{stats.total}</p>
                <p className="text-cream/60 text-sm">Registraties</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold text-gold">{stats.totalPersons}</p>
                <p className="text-cream/60 text-sm">Totaal personen</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold text-gold">{stats.withPartner}</p>
                <p className="text-cream/60 text-sm">Met partner</p>
              </CardContent>
            </Card>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card>
              <CardContent className="py-4 text-center">
                <p className="text-3xl font-bold text-gold">{stats.withPredictions}</p>
                <p className="text-cream/60 text-sm">Voorspellingen</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Registrations List */}
        <Card>
          <CardHeader>
            <CardTitle>Registraties</CardTitle>
            <CardDescription>Alle aanmeldingen voor de Winterproef</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto mb-4" />
                <p className="text-cream/60">Laden...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <p className="text-warm-red mb-4">{error}</p>
                <p className="text-cream/50 text-sm">
                  Zorg dat de Supabase environment variables zijn ingesteld in Netlify.
                </p>
              </div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-cream/60 mb-2">Nog geen registraties</p>
                <p className="text-cream/40 text-sm">
                  Registraties verschijnen hier zodra mensen zich aanmelden.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {registrations.map((reg, index) => (
                  <motion.div
                    key={reg.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-dark-wood/30 rounded-lg p-4 border border-gold/20"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-gold font-semibold text-lg">
                            {reg.users?.name || 'Onbekend'}
                          </h3>
                          {reg.ai_assignment && (
                            <span
                              className={`px-2 py-0.5 rounded text-xs font-bold text-dark-wood ${
                                WARNING_COLORS[reg.ai_assignment.warningLevel] || 'bg-gold'
                              }`}
                            >
                              {reg.ai_assignment.warningLevel}
                            </span>
                          )}
                          {reg.has_partner && (
                            <span className="px-2 py-0.5 rounded text-xs bg-gold/20 text-gold">
                              +1 partner
                            </span>
                          )}
                        </div>
                        <p className="text-cream/60 text-sm mb-1">
                          {reg.users?.email || 'Geen email'}
                        </p>
                        {reg.ai_assignment && (
                          <p className="text-cream/80 text-sm">
                            <span className="text-gold">{reg.ai_assignment.officialTitle}</span>
                            {' — '}
                            {reg.ai_assignment.task}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 text-sm text-cream/50">
                        <p>Skill: {SKILL_LABELS[reg.primary_skill] || reg.primary_skill}</p>
                        <p>Muziek: {reg.music_decade} {reg.music_genre}</p>
                        {reg.dietary_requirements && (
                          <p className="text-yellow-500">Dieet: {reg.dietary_requirements}</p>
                        )}
                        {reg.predictions && Object.keys(reg.predictions).length > 0 && (
                          <span className="text-success-green">✓ Voorspellingen</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link href="/admin/payments">
            <Card className="hover:border-gold/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <p className="text-gold font-semibold mb-1">Betalingen</p>
                <p className="text-cream/50 text-sm">Tikkie overzicht en instellingen</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/quiz">
            <Card className="hover:border-gold/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <p className="text-gold font-semibold mb-1">Quiz Beheer</p>
                <p className="text-cream/50 text-sm">Vragen beheren en quiz starten</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/predictions">
            <Card className="hover:border-gold/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <p className="text-gold font-semibold mb-1">Voorspellingen</p>
                <p className="text-cream/50 text-sm">Uitkomsten invullen</p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/admin/ratings">
            <Card className="hover:border-gold/50 transition-colors cursor-pointer">
              <CardContent className="py-6 text-center">
                <p className="text-gold font-semibold mb-1">Beoordelingen</p>
                <p className="text-cream/50 text-sm">Boy Boom resultaten</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Feature Toggles */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Feature Toggles</CardTitle>
            <CardDescription>Schakel dashboard modules aan of uit</CardDescription>
          </CardHeader>
          <CardContent>
            {featuresLoading ? (
              <div className="text-center py-4">
                <div className="w-6 h-6 border-2 border-gold/30 border-t-gold rounded-full animate-spin mx-auto" />
              </div>
            ) : features.length === 0 ? (
              <p className="text-cream/60 text-center py-4">Geen features gevonden</p>
            ) : (
              <div className="space-y-3">
                {features.map((feature) => (
                  <div
                    key={feature.feature_key}
                    className="flex items-center justify-between p-3 bg-dark-wood/30 rounded-lg border border-gold/10"
                  >
                    <div>
                      <p className="text-cream font-medium">
                        {FEATURE_LABELS[feature.feature_key] || feature.feature_key}
                      </p>
                      <p className="text-cream/50 text-sm">{feature.description}</p>
                    </div>
                    <button
                      onClick={() => toggleFeature(feature.feature_key, feature.is_enabled)}
                      disabled={togglingFeature === feature.feature_key}
                      className={`relative w-14 h-8 rounded-full transition-colors duration-200 ${
                        feature.is_enabled ? 'bg-success-green' : 'bg-dark-wood'
                      } ${togglingFeature === feature.feature_key ? 'opacity-50' : ''}`}
                    >
                      <span
                        className={`absolute top-1 w-6 h-6 bg-cream rounded-full transition-transform duration-200 ${
                          feature.is_enabled ? 'translate-x-7' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-cream/30 text-xs uppercase tracking-widest">
            Bovenkamer Winterproef Admin
          </p>
        </div>
      </div>
    </main>
  );
}
