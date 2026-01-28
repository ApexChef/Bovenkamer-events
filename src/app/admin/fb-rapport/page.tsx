'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AuthGuard } from '@/components/AuthGuard';
import {
  ReportHeader,
  DietaryWarnings,
  MeatBreakdown,
  DrinkBreakdown,
  SidesBreakdown,
  PersonDetailList,
} from '@/components/fb-report';
import {
  calculateMeatStats,
  calculateDrinkStats,
  groupDietaryRequirements,
  calculateAverageVeggies,
  calculateAverageSauces,
} from '@/lib/fb-calculations';
import type { FBReportData } from '@/types';

export default function FBRapportPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <FBRapportContent />
    </AuthGuard>
  );
}

function FBRapportContent() {
  const [reportData, setReportData] = useState<FBReportData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState('');

  // Fetch report data
  const fetchReportData = async () => {
    try {
      const response = await fetch('/api/admin/fb-report');
      const data = await response.json();

      if (response.ok) {
        setReportData(data);
        setError('');
      } else {
        setError(data.message || 'Kon rapport niet laden');
      }
    } catch (err) {
      console.error('Failed to fetch report:', err);
      setError('Netwerkfout bij ophalen rapport');
    }
  };

  // Initial load
  useEffect(() => {
    fetchReportData().finally(() => setIsLoading(false));
  }, []);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchReportData();
    setIsRefreshing(false);
  };

  // Print handler
  const handlePrint = () => {
    window.print();
  };

  // Excel export handler
  const handleExportExcel = async () => {
    if (!reportData) return;

    try {
      // Dynamic import to reduce bundle size
      const XLSX = await import('xlsx');

      // Transform persons data to flat rows
      const exportData = reportData.persons.map((person) => ({
        Naam: person.name,
        Type: person.personType === 'self' ? 'Deelnemer' : 'Partner',
        Dieet: person.dietaryRequirements || '-',
        'Varkensvlees %': person.meatDistribution.pork,
        'Rundvlees %': person.meatDistribution.beef,
        'Kip %': person.meatDistribution.chicken,
        'Wild %': person.meatDistribution.game,
        'Vis %': person.meatDistribution.fish,
        'Vegetarisch %': person.meatDistribution.vegetarian,
        'Groenten (1-5)': person.veggiesPreference,
        'Sauzen (1-5)': person.saucesPreference,
        'Start met bubbels': person.startsWithBubbles ? 'Ja' : 'Nee',
        'Bubbel type': person.bubbleType || '-',
        'Frisdrank %': person.drinkDistribution.softDrinks,
        'Wijn %': person.drinkDistribution.wine,
        'Bier %': person.drinkDistribution.beer,
        'Wijn voorkeur': person.winePreference !== null
          ? `${100 - person.winePreference}% rood / ${person.winePreference}% wit`
          : '-',
        'Bier type': person.beerType || '-',
        'Frisdrank keuze': person.softDrinkPreference || '-',
        'Water voorkeur':
          person.waterPreference === 'sparkling'
            ? 'Bruisend'
            : person.waterPreference === 'flat'
            ? 'Plat'
            : '-',
      }));

      // Create worksheet
      const ws = XLSX.utils.json_to_sheet(exportData);

      // Set column widths
      ws['!cols'] = [
        { wch: 20 }, // Naam
        { wch: 12 }, // Type
        { wch: 30 }, // Dieet
        { wch: 12 }, // Varkensvlees %
        { wch: 12 }, // Rundvlees %
        { wch: 12 }, // Kip %
        { wch: 12 }, // Wild %
        { wch: 12 }, // Vis %
        { wch: 12 }, // Vegetarisch %
        { wch: 15 }, // Groenten
        { wch: 15 }, // Sauzen
        { wch: 15 }, // Start met bubbels
        { wch: 15 }, // Bubbel type
        { wch: 12 }, // Frisdrank %
        { wch: 12 }, // Wijn %
        { wch: 12 }, // Bier %
        { wch: 20 }, // Wijn voorkeur
        { wch: 12 }, // Bier type
        { wch: 15 }, // Frisdrank keuze
        { wch: 15 }, // Water voorkeur
      ];

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'F&B Voorkeuren');

      // Add summary sheet
      const summaryData = [
        { Categorie: 'Totaal Personen', Waarde: reportData.completionStatus.totalPersons },
        { Categorie: 'Deelnemers', Waarde: reportData.completionStatus.totalParticipants },
        {
          Categorie: 'Partners',
          Waarde:
            reportData.completionStatus.totalPersons -
            reportData.completionStatus.totalParticipants,
        },
        { Categorie: 'Voorkeuren Ingevuld', Waarde: reportData.completionStatus.completed },
        { Categorie: '', Waarde: '' },
        { Categorie: 'Totaal Vlees (kg)', Waarde: meatStats.totalKg.toFixed(2) },
        { Categorie: 'Wijn Flessen', Waarde: drinkStats.wine.bottles },
        { Categorie: 'Bier Kratten', Waarde: drinkStats.beer.crates },
      ];
      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Samenvatting');

      // Generate filename with date
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `fb-rapport-${dateStr}.xlsx`;

      // Trigger download
      XLSX.writeFile(wb, filename);
    } catch (err) {
      console.error('Failed to export Excel:', err);
      alert('Fout bij exporteren naar Excel');
    }
  };

  // Calculate statistics using useMemo
  const meatStats = useMemo(
    () => calculateMeatStats(reportData?.persons || []),
    [reportData?.persons]
  );

  const drinkStats = useMemo(
    () => calculateDrinkStats(reportData?.persons || []),
    [reportData?.persons]
  );

  const dietaryGroups = useMemo(
    () => groupDietaryRequirements(reportData?.persons || []),
    [reportData?.persons]
  );

  const averageVeggies = useMemo(
    () => calculateAverageVeggies(reportData?.persons || []),
    [reportData?.persons]
  );

  const averageSauces = useMemo(
    () => calculateAverageSauces(reportData?.persons || []),
    [reportData?.persons]
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-deep-green flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gold border-t-transparent mb-4"></div>
          <p className="text-cream">Rapport laden...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-deep-green flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-wood/80 border border-warm-red rounded-lg p-6 max-w-md"
        >
          <h2 className="text-warm-red font-display text-2xl mb-2">Fout</h2>
          <p className="text-cream mb-4">{error}</p>
          <button
            onClick={() => {
              setError('');
              setIsLoading(true);
              fetchReportData().finally(() => setIsLoading(false));
            }}
            className="bg-gold text-deep-green px-4 py-2 rounded-lg hover:bg-gold/90 transition-colors"
          >
            Opnieuw proberen
          </button>
        </motion.div>
      </div>
    );
  }

  // No data state
  if (!reportData || reportData.persons.length === 0) {
    return (
      <div className="min-h-screen bg-deep-green flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-dark-wood/80 border border-gold/20 rounded-lg p-6 max-w-md text-center"
        >
          <h2 className="text-gold font-display text-2xl mb-2">Geen Data</h2>
          <p className="text-cream mb-4">
            Er zijn nog geen voorkeuren ingevuld. Zodra deelnemers hun voorkeuren hebben ingevuld,
            wordt het rapport hier getoond.
          </p>
        </motion.div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-deep-green">
      <div className="max-w-7xl mx-auto p-4 lg:p-8 print:p-0">
        <ReportHeader
          timestamp={reportData.timestamp}
          completionStatus={reportData.completionStatus}
          onRefresh={handleRefresh}
          onPrint={handlePrint}
          onExportExcel={handleExportExcel}
          isRefreshing={isRefreshing}
        />

        <DietaryWarnings groups={dietaryGroups} />

        <MeatBreakdown stats={meatStats} />

        <DrinkBreakdown stats={drinkStats} />

        <SidesBreakdown averageVeggies={averageVeggies} averageSauces={averageSauces} />

        <PersonDetailList persons={reportData.persons} />
      </div>
    </div>
  );
}
