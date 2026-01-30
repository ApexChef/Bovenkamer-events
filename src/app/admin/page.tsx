'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChefHat,
  Package,
  BarChart3,
  Users,
  CreditCard,
  ClipboardList,
  FileText,
  Trophy,
  Target,
  Star,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui';
import { AuthGuard } from '@/components/AuthGuard';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { FeatureKey } from '@/types';

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
  show_live_ranking: 'Live Ranking',
  show_prediction_evaluation: 'Voorspellingen Evaluatie',
  show_ratings: 'Boy Boom Beoordeling',
};

interface AdminItem {
  href: string;
  label: string;
  description: string;
  icon: React.ElementType;
}

interface AdminGroup {
  label: string;
  items: AdminItem[];
}

const adminGroups: AdminGroup[] = [
  {
    label: 'Event & Menu',
    items: [
      { href: '/admin/menu', label: 'Menu Beheer', description: 'Gerechten en menu samenstellen', icon: ChefHat },
      { href: '/admin/purchase-orders', label: 'Inkooporders', description: 'Inkoop en bestellingen', icon: Package },
      { href: '/admin/fb-rapport', label: 'F&B Rapport', description: 'Boodschappenlijst genereren', icon: BarChart3 },
    ],
  },
  {
    label: 'Deelnemers & Activiteit',
    items: [
      { href: '/admin/gebruikers', label: 'Gebruikersbeheer', description: 'Accounts, rollen en punten', icon: Users },
      { href: '/admin/payments', label: 'Betalingen', description: 'Tikkie overzicht en instellingen', icon: CreditCard },
      { href: '/admin/registraties', label: 'Registraties', description: 'Aanmeldingen beheren', icon: ClipboardList },
      { href: '/admin/formulieren', label: 'Formulieren', description: 'Formulieren en vragen beheren', icon: FileText },
    ],
  },
  {
    label: 'Entertainment',
    items: [
      { href: '/admin/quiz', label: 'Quiz Beheer', description: 'Vragen beheren en quiz starten', icon: Trophy },
      { href: '/admin/predictions', label: 'Voorspellingen', description: 'Uitkomsten invullen', icon: Target },
      { href: '/admin/ratings', label: 'Beoordelingen', description: 'Boy Boom resultaten', icon: Star },
    ],
  },
];

const favoriteHrefs = [
  '/admin/menu',
  '/admin/gebruikers',
  '/admin/payments',
  '/admin/quiz',
  '/admin/formulieren',
  '/admin/fb-rapport',
];

const favoriteItems = favoriteHrefs
  .map(href => adminGroups.flatMap(g => g.items).find(item => item.href === href))
  .filter((item): item is AdminItem => item !== undefined);

function AdminPageContent() {
  const [features, setFeatures] = useState<FeatureToggle[]>([]);
  const [featuresLoading, setFeaturesLoading] = useState(true);
  const [togglingFeature, setTogglingFeature] = useState<string | null>(null);

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

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-gold mb-2">
            Admin Dashboard
          </h1>
          <p className="text-cream/60">Beheer de Winterproef</p>
        </div>

        {/* Favorieten */}
        <div className="mb-8">
          <h2 className="font-display text-lg font-semibold text-cream mb-4">Favorieten</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {favoriteItems.map((item) => (
              <Link key={item.href} href={item.href}>
                <Card className="hover:border-gold/50 transition-colors cursor-pointer">
                  <CardContent className="py-6 text-center">
                    <item.icon className="w-6 h-6 text-gold mx-auto mb-2" />
                    <p className="text-gold font-semibold mb-1">{item.label}</p>
                    <p className="text-cream/50 text-sm">{item.description}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Alle Beheer — gegroepeerd */}
        <div className="mb-8">
          <h2 className="font-display text-lg font-semibold text-cream mb-4">Alle Beheer</h2>
          <div className="space-y-6">
            {adminGroups.map((group) => (
              <div key={group.label}>
                <h3 className="text-sm text-cream/50 uppercase tracking-wider mb-3">{group.label}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                  {group.items.map((item) => (
                    <Link key={item.href} href={item.href}>
                      <Card className="hover:border-gold/50 transition-colors cursor-pointer">
                        <CardContent className="py-4 flex items-center gap-3">
                          <item.icon className="w-5 h-5 text-gold shrink-0" />
                          <div className="min-w-0">
                            <p className="text-cream font-medium text-sm">{item.label}</p>
                            <p className="text-cream/40 text-xs truncate">{item.description}</p>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
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
    </DashboardLayout>
  );
}
