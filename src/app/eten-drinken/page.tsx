'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { ArrowLeft, UtensilsCrossed, Wine, Check, User, Users } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/lib/store';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent, Button, Input } from '@/components/ui';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { PercentageDistribution } from '@/components/ui/PercentageDistribution';
import {
  FoodDrinkPreference,
  PersonType,
  MeatDistribution,
  DrinkDistribution,
  DEFAULT_MEAT_DISTRIBUTION,
  DEFAULT_DRINK_DISTRIBUTION,
  DEFAULT_FOOD_DRINK_PREFERENCE,
} from '@/types';

type TabType = 'eten' | 'drinken';

// Meat distribution items
const meatItems = [
  { key: 'pork', label: 'Varkensvlees', emoji: '🐷', color: '#e8a0a0' },
  { key: 'beef', label: 'Rundvlees', emoji: '🐄', color: '#8B4513' },
  { key: 'chicken', label: 'Kip', emoji: '🐔', color: '#f5deb3' },
  { key: 'game', label: 'Wild', emoji: '🦌', color: '#654321' },
  { key: 'fish', label: 'Vis & Schaaldieren', emoji: '🐟', color: '#4682B4' },
  { key: 'vegetarian', label: 'Vegetarisch', emoji: '🥬', color: '#228B22' },
];

// Drink distribution items
const drinkItems = [
  { key: 'softDrinks', label: 'Frisdrank', emoji: '🥤', color: '#FF6B6B' },
  { key: 'wine', label: 'Wijn', emoji: '🍷', color: '#722F37' },
  { key: 'beer', label: 'Bier', emoji: '🍺', color: '#F4A460' },
];

interface PersonPreferences {
  dietaryRequirements: string;
  meatDistribution: MeatDistribution;
  veggiesPreference: number;
  saucesPreference: number;
  startsWithBubbles: boolean | null;
  bubbleType: 'champagne' | 'prosecco' | null;
  drinkDistribution: DrinkDistribution;
  softDrinkPreference: string | null;
  softDrinkOther: string;
  waterPreference: 'sparkling' | 'flat' | null;
  winePreference: number | null;
  beerType: 'pils' | 'speciaal' | null;
}

export default function EtenDrinkenPage() {
  const router = useRouter();
  const { currentUser, isAuthenticated, _hasHydrated } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('eten');
  const [selectedPerson, setSelectedPerson] = useState<'self' | 'partner'>('self');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerName, setPartnerName] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  // Self preferences
  const [selfPrefs, setSelfPrefs] = useState<PersonPreferences>({
    ...DEFAULT_FOOD_DRINK_PREFERENCE,
  });

  // Partner preferences
  const [partnerPrefs, setPartnerPrefs] = useState<PersonPreferences>({
    ...DEFAULT_FOOD_DRINK_PREFERENCE,
  });

  // Track if data has been saved
  const [selfSaved, setSelfSaved] = useState(false);
  const [partnerSaved, setPartnerSaved] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (_hasHydrated && !isAuthenticated) {
      router.push('/login');
    }
  }, [_hasHydrated, isAuthenticated, router]);

  // Load preferences
  useEffect(() => {
    if (!currentUser?.email) return;

    const loadPreferences = async () => {
      try {
        const response = await fetch(`/api/food-drinks?email=${encodeURIComponent(currentUser.email)}`);
        if (!response.ok) throw new Error('Failed to load preferences');

        const data = await response.json();
        setHasPartner(data.hasPartner);
        setPartnerName(data.partnerName);
        setUserName(data.user?.name?.split(' ')[0] || 'Jij');

        if (data.selfPreference) {
          setSelfPrefs({
            dietaryRequirements: data.selfPreference.dietaryRequirements || '',
            meatDistribution: data.selfPreference.meatDistribution || DEFAULT_MEAT_DISTRIBUTION,
            veggiesPreference: data.selfPreference.veggiesPreference ?? 3,
            saucesPreference: data.selfPreference.saucesPreference ?? 3,
            startsWithBubbles: data.selfPreference.startsWithBubbles,
            bubbleType: data.selfPreference.bubbleType,
            drinkDistribution: data.selfPreference.drinkDistribution || DEFAULT_DRINK_DISTRIBUTION,
            softDrinkPreference: data.selfPreference.softDrinkPreference,
            softDrinkOther: data.selfPreference.softDrinkOther || '',
            waterPreference: data.selfPreference.waterPreference,
            winePreference: data.selfPreference.winePreference ?? null,
            beerType: data.selfPreference.beerType ?? null,
          });
          setSelfSaved(true);
        }

        if (data.partnerPreference) {
          setPartnerPrefs({
            dietaryRequirements: data.partnerPreference.dietaryRequirements || '',
            meatDistribution: data.partnerPreference.meatDistribution || DEFAULT_MEAT_DISTRIBUTION,
            veggiesPreference: data.partnerPreference.veggiesPreference ?? 3,
            saucesPreference: data.partnerPreference.saucesPreference ?? 3,
            startsWithBubbles: data.partnerPreference.startsWithBubbles,
            bubbleType: data.partnerPreference.bubbleType,
            drinkDistribution: data.partnerPreference.drinkDistribution || DEFAULT_DRINK_DISTRIBUTION,
            softDrinkPreference: data.partnerPreference.softDrinkPreference,
            softDrinkOther: data.partnerPreference.softDrinkOther || '',
            waterPreference: data.partnerPreference.waterPreference,
            winePreference: data.partnerPreference.winePreference ?? null,
            beerType: data.partnerPreference.beerType ?? null,
          });
          setPartnerSaved(true);
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [currentUser?.email]);

  const savePreferences = async (personType: PersonType) => {
    if (!currentUser?.email) return;

    setIsSaving(true);
    try {
      const prefs = personType === 'self' ? selfPrefs : partnerPrefs;

      const response = await fetch('/api/food-drinks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          personType,
          data: prefs,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      if (personType === 'self') {
        setSelfSaved(true);
      } else {
        setPartnerSaved(true);
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle drink distribution changes with conditional resets
  const handleDistributionChange = (
    prefs: PersonPreferences,
    setPrefs: React.Dispatch<React.SetStateAction<PersonPreferences>>,
    newDistribution: DrinkDistribution
  ) => {
    const updates: Partial<PersonPreferences> = {
      drinkDistribution: newDistribution,
    };

    // Reset wine preference if wine drops to 10% or below
    if (newDistribution.wine <= 10 && prefs.winePreference !== null) {
      updates.winePreference = null;
    }

    // Reset beer type if beer drops to 0%
    if (newDistribution.beer === 0 && prefs.beerType !== null) {
      updates.beerType = null;
    }

    setPrefs({ ...prefs, ...updates });
  };

  if (!_hasHydrated || isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold" />
        </div>
      </DashboardLayout>
    );
  }

  const renderFoodSection = (
    prefs: PersonPreferences,
    setPrefs: React.Dispatch<React.SetStateAction<PersonPreferences>>,
    personType: PersonType,
    name: string
  ) => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-gold">
        {personType === 'self' ? <User size={20} /> : <Users size={20} />}
        <h3 className="font-semibold">{name}</h3>
        {(personType === 'self' ? selfSaved : partnerSaved) && (
          <Check size={16} className="text-success-green" />
        )}
      </div>

      {/* Dieetwensen */}
      <Input
        label="Dieetwensen / Allergieën"
        value={prefs.dietaryRequirements}
        onChange={(e) => setPrefs({ ...prefs, dietaryRequirements: e.target.value })}
        placeholder="Vegetarisch, glutenvrij, noten allergie..."
      />

      {/* Eiwitten Verdeling */}
      <div className="space-y-3 p-4 bg-dark-wood/30 rounded-lg border border-cream/10">
        <h4 className="text-gold font-medium">🍽️ Eiwitten Verdeling</h4>
        <p className="text-xs text-cream/50">Verdeel je voorkeur (totaal 100%)</p>
        <PercentageDistribution
          items={meatItems}
          values={prefs.meatDistribution as unknown as Record<string, number>}
          onChange={(values) => setPrefs({ ...prefs, meatDistribution: values as unknown as MeatDistribution })}
        />
      </div>

      {/* Groentes */}
      <div className="space-y-2">
        <h4 className="text-gold font-medium">🥗 Groentes & Salades</h4>
        <SegmentedControl
          label=""
          options={[
            { value: 0, label: 'Nee', emoji: '🚫' },
            { value: 1, label: 'Beetje', emoji: '🥬' },
            { value: 2, label: 'Normaal', emoji: '🥗' },
            { value: 3, label: 'Graag', emoji: '🥦' },
            { value: 4, label: 'Veel', emoji: '🥕' },
            { value: 5, label: 'Rabbit', emoji: '🐰' },
          ]}
          value={prefs.veggiesPreference}
          onChange={(val) => setPrefs({ ...prefs, veggiesPreference: val })}
        />
      </div>

      {/* Sauzen */}
      <div className="space-y-2">
        <h4 className="text-gold font-medium">🍟 Sauzen</h4>
        <SegmentedControl
          label=""
          options={[
            { value: 0, label: 'Geen', emoji: '🚫' },
            { value: 1, label: 'Mayo', emoji: '🍟' },
            { value: 2, label: 'Ketchup', emoji: '🍅' },
            { value: 3, label: 'BBQ', emoji: '🔥' },
            { value: 4, label: 'Pesto', emoji: '🌿' },
            { value: 5, label: 'Chimi', emoji: '🌱' },
          ]}
          value={prefs.saucesPreference}
          onChange={(val) => setPrefs({ ...prefs, saucesPreference: val })}
        />
      </div>

      <Button
        onClick={() => savePreferences(personType)}
        disabled={isSaving}
        isLoading={isSaving}
        className="w-full"
      >
        Opslaan
      </Button>
    </div>
  );

  const renderDrinkSection = (
    prefs: PersonPreferences,
    setPrefs: React.Dispatch<React.SetStateAction<PersonPreferences>>,
    personType: PersonType,
    name: string
  ) => (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-gold">
        {personType === 'self' ? <User size={20} /> : <Users size={20} />}
        <h3 className="font-semibold">{name}</h3>
        {(personType === 'self' ? selfSaved : partnerSaved) && (
          <Check size={16} className="text-success-green" />
        )}
      </div>

      {/* Bubbels */}
      <div className="space-y-3">
        <h4 className="text-gold font-medium">🥂 Begin met een bubbel?</h4>
        <SegmentedControl
          label=""
          options={[
            { value: 0, label: 'Nee', emoji: '🚫' },
            { value: 1, label: 'Ja!', emoji: '🥂' },
          ]}
          value={prefs.startsWithBubbles === null ? -1 : (prefs.startsWithBubbles ? 1 : 0)}
          onChange={(val) => {
            setPrefs({
              ...prefs,
              startsWithBubbles: val === 1,
              bubbleType: val === 0 ? null : prefs.bubbleType,
            });
          }}
        />
        {prefs.startsWithBubbles && (
          <div className="ml-4">
            <SegmentedControl
              label="Welke bubbels?"
              options={[
                { value: 0, label: 'Champagne', emoji: '🍾' },
                { value: 1, label: 'Prosecco/Cava', emoji: '🥂' },
              ]}
              value={prefs.bubbleType === 'champagne' ? 0 : prefs.bubbleType === 'prosecco' ? 1 : -1}
              onChange={(val) => setPrefs({ ...prefs, bubbleType: val === 0 ? 'champagne' : 'prosecco' })}
            />
          </div>
        )}
      </div>

      {/* Drank Verdeling */}
      <div className="space-y-3 p-4 bg-dark-wood/30 rounded-lg border border-cream/10">
        <h4 className="text-gold font-medium">🍻 Drank Verdeling</h4>
        <p className="text-xs text-cream/50">Verdeel je voorkeur (totaal 100%)</p>
        <PercentageDistribution
          items={drinkItems}
          values={prefs.drinkDistribution as unknown as Record<string, number>}
          onChange={(values) => handleDistributionChange(
            prefs,
            setPrefs,
            values as unknown as DrinkDistribution
          )}
        />

        {/* Conditional: soft drink or water preference */}
        {prefs.drinkDistribution.softDrinks > 10 ? (
          <div className="mt-4 pt-4 border-t border-cream/10 space-y-3">
            <h5 className="text-sm text-gold">Welke frisdrank?</h5>
            <SegmentedControl
              label=""
              options={[
                { value: 0, label: 'Cola', emoji: '🥤' },
                { value: 1, label: 'Sinas', emoji: '🍊' },
                { value: 2, label: 'Spa Rood', emoji: '💧' },
                { value: 3, label: 'Overige', emoji: '📝' },
              ]}
              value={
                prefs.softDrinkPreference === 'cola' ? 0 :
                prefs.softDrinkPreference === 'sinas' ? 1 :
                prefs.softDrinkPreference === 'spa_rood' ? 2 :
                prefs.softDrinkPreference === 'overige' ? 3 : -1
              }
              onChange={(val) => {
                const pref = val === 0 ? 'cola' : val === 1 ? 'sinas' : val === 2 ? 'spa_rood' : 'overige';
                setPrefs({
                  ...prefs,
                  softDrinkPreference: pref,
                  softDrinkOther: pref !== 'overige' ? '' : prefs.softDrinkOther,
                });
              }}
            />
            {prefs.softDrinkPreference === 'overige' && (
              <Input
                label="Welke frisdrank?"
                value={prefs.softDrinkOther}
                onChange={(e) => setPrefs({ ...prefs, softDrinkOther: e.target.value })}
                placeholder="Bijv. Ice Tea, Cassis..."
              />
            )}
          </div>
        ) : (
          <div className="mt-4 pt-4 border-t border-cream/10 space-y-3">
            <h5 className="text-sm text-gold">Water voorkeur</h5>
            <SegmentedControl
              label=""
              options={[
                { value: 0, label: 'Plat', emoji: '💧' },
                { value: 1, label: 'Bruisend', emoji: '🫧' },
              ]}
              value={prefs.waterPreference === 'flat' ? 0 : prefs.waterPreference === 'sparkling' ? 1 : -1}
              onChange={(val) => setPrefs({ ...prefs, waterPreference: val === 0 ? 'flat' : 'sparkling' })}
            />
          </div>
        )}

        {/* Conditional: wine preference (red/white) */}
        {prefs.drinkDistribution.wine > 10 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-4 border-t border-cream/10 space-y-3"
          >
            <div className="text-gold text-sm font-medium flex items-center gap-2">
              <span>🍷</span>
              <span>Zo, jij houdt van wijn!</span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="text-cream/70">100% Rood</span>
                <span className="text-cream/70">100% Wit</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={prefs.winePreference ?? 50}
                onChange={(e) => setPrefs({
                  ...prefs,
                  winePreference: parseInt(e.target.value)
                })}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer
                  bg-gradient-to-r from-[#722F37] to-[#F5F5DC]
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-5
                  [&::-webkit-slider-thumb]:h-5
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-gold
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-moz-range-thumb]:w-5
                  [&::-moz-range-thumb]:h-5
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-gold
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:cursor-pointer"
              />
              <div className="text-center text-gold text-sm font-medium">
                {prefs.winePreference === null || prefs.winePreference === 50
                  ? '50/50 Mix'
                  : prefs.winePreference < 33
                    ? '🍷 Vooral Rood'
                    : prefs.winePreference < 50
                      ? 'Meer Rood'
                      : prefs.winePreference < 67
                        ? 'Meer Wit'
                        : '🤍 Vooral Wit'
                }
              </div>
            </div>
          </motion.div>
        )}

        {/* Conditional: beer type selection */}
        {prefs.drinkDistribution.beer > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-4 pt-4 border-t border-cream/10 space-y-3"
          >
            <h5 className="text-sm text-gold">Welk bier?</h5>
            <SegmentedControl
              label=""
              options={[
                { value: 0, label: 'Pils', emoji: '🍺' },
                { value: 1, label: 'Speciaal Bier', emoji: '🍻' },
              ]}
              value={prefs.beerType === 'pils' ? 0 : prefs.beerType === 'speciaal' ? 1 : -1}
              onChange={(val) => setPrefs({
                ...prefs,
                beerType: val === 0 ? 'pils' : 'speciaal'
              })}
            />
            {prefs.beerType === 'speciaal' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                className="p-3 bg-warm-red/20 border border-warm-red/40 rounded-lg"
              >
                <p className="text-cream text-sm italic text-center font-medium">
                  &quot;Dit is een BBQ, geen Beer Craft festival!&quot;
                </p>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      <Button
        onClick={() => savePreferences(personType)}
        disabled={isSaving}
        isLoading={isSaving}
        className="w-full"
      >
        Opslaan
      </Button>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-cream/60 hover:text-cream">
            <ArrowLeft size={24} />
          </Link>
          <h1 className="text-2xl font-bold text-gold">Eten & Drinken</h1>
        </div>

        <p className="text-cream/70">
          Vul je eet- en drinkvoorkeuren in zodat we de BBQ perfect kunnen voorbereiden.
          {hasPartner && ' Vergeet niet ook de voorkeuren van je partner in te vullen!'}
        </p>

        {/* Tabs */}
        <div className="flex gap-2 p-1 bg-deep-green/50 rounded-lg">
          <button
            onClick={() => setActiveTab('eten')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-colors ${
              activeTab === 'eten'
                ? 'bg-gold text-deep-green font-medium'
                : 'text-cream/70 hover:text-cream'
            }`}
          >
            <UtensilsCrossed size={20} />
            <span>Eten</span>
          </button>
          <button
            onClick={() => setActiveTab('drinken')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-md transition-colors ${
              activeTab === 'drinken'
                ? 'bg-gold text-deep-green font-medium'
                : 'text-cream/70 hover:text-cream'
            }`}
          >
            <Wine size={20} />
            <span>Drinken</span>
          </button>
        </div>

        {/* Sub-tabs for person selection */}
        {hasPartner && (
          <div className="flex gap-2 p-1 bg-deep-green/50 rounded-lg">
            <button
              onClick={() => setSelectedPerson('self')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm ${
                selectedPerson === 'self'
                  ? 'bg-gold text-deep-green font-medium'
                  : 'text-cream/70 hover:text-cream'
              }`}
            >
              {userName}
            </button>
            <button
              onClick={() => setSelectedPerson('partner')}
              className={`flex-1 py-2 px-4 rounded-md transition-colors text-sm ${
                selectedPerson === 'partner'
                  ? 'bg-gold text-deep-green font-medium'
                  : 'text-cream/70 hover:text-cream'
              }`}
            >
              {partnerName || 'Partner'}
            </button>
          </div>
        )}

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardContent className="pt-6">
                {activeTab === 'eten'
                  ? renderFoodSection(
                      selectedPerson === 'self' ? selfPrefs : partnerPrefs,
                      selectedPerson === 'self' ? setSelfPrefs : setPartnerPrefs,
                      selectedPerson,
                      selectedPerson === 'self' ? userName : (partnerName || 'Partner')
                    )
                  : renderDrinkSection(
                      selectedPerson === 'self' ? selfPrefs : partnerPrefs,
                      selectedPerson === 'self' ? setSelfPrefs : setPartnerPrefs,
                      selectedPerson,
                      selectedPerson === 'self' ? userName : (partnerName || 'Partner')
                    )
                }
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Completion status */}
        <Card className="bg-deep-green/30 border-gold/20">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <span className="text-cream/70">Status</span>
              <div className="flex items-center gap-4">
                <span className={`flex items-center gap-1 ${selfSaved ? 'text-success-green' : 'text-cream/50'}`}>
                  {selfSaved ? <Check size={16} /> : '○'} {userName}
                </span>
                {hasPartner && (
                  <span className={`flex items-center gap-1 ${partnerSaved ? 'text-success-green' : 'text-cream/50'}`}>
                    {partnerSaved ? <Check size={16} /> : '○'} {partnerName || 'Partner'}
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
