'use client';

import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { FileDown, Printer, RefreshCw } from 'lucide-react';

interface ReportHeaderProps {
  timestamp: string;
  completionStatus: {
    completed: number;
    totalParticipants: number;
    totalPersons: number;
  };
  onRefresh: () => void;
  onPrint: () => void;
  onExportExcel: () => void;
  isRefreshing?: boolean;
}

export function ReportHeader({
  timestamp,
  completionStatus,
  onRefresh,
  onPrint,
  onExportExcel,
  isRefreshing = false,
}: ReportHeaderProps) {
  const completionPercentage = completionStatus.totalParticipants > 0
    ? Math.round((completionStatus.completed / completionStatus.totalParticipants) * 100)
    : 0;

  const isIncomplete = completionStatus.completed < completionStatus.totalParticipants;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-dark-wood/80 border border-gold/20 rounded-lg p-6 mb-6 print:border-black print:p-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title and timestamp */}
        <div>
          <h1 className="font-display text-3xl text-gold mb-2 print:text-2xl print:text-black">
            Food & Beverage Rapport
          </h1>
          <p className="text-cream/70 text-sm print:text-black">
            Gegenereerd: {new Date(timestamp).toLocaleString('nl-NL', {
              dateStyle: 'long',
              timeStyle: 'short',
            })}
          </p>
        </div>

        {/* Export buttons */}
        <div className="flex gap-2 print:hidden">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Verversen
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onPrint}
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Print PDF
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onExportExcel}
            className="flex items-center gap-2"
          >
            <FileDown className="w-4 h-4" />
            Excel
          </Button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-deep-green/30 rounded-lg p-4 print:border print:border-black">
          <div className="text-cream/60 text-sm mb-1 print:text-black">Totaal Personen</div>
          <div className="text-gold text-2xl font-bold print:text-black">
            {completionStatus.totalPersons}
          </div>
          <div className="text-cream/50 text-xs mt-1 print:text-black">
            (incl. {completionStatus.totalPersons - completionStatus.totalParticipants} partners)
          </div>
        </div>

        <div className="bg-deep-green/30 rounded-lg p-4 print:border print:border-black">
          <div className="text-cream/60 text-sm mb-1 print:text-black">Deelnemers</div>
          <div className="text-gold text-2xl font-bold print:text-black">
            {completionStatus.totalParticipants}
          </div>
          <div className="text-cream/50 text-xs mt-1 print:text-black">actieve deelnemers</div>
        </div>

        <div className="bg-deep-green/30 rounded-lg p-4 print:border print:border-black">
          <div className="text-cream/60 text-sm mb-1 print:text-black">Voorkeuren Ingevuld</div>
          <div className="text-gold text-2xl font-bold print:text-black">
            {completionStatus.completed}
          </div>
          <div className="text-cream/50 text-xs mt-1 print:text-black">
            van {completionStatus.totalParticipants} deelnemers
          </div>
        </div>

        <div className="bg-deep-green/30 rounded-lg p-4 print:border print:border-black">
          <div className="text-cream/60 text-sm mb-1 print:text-black">Compleetheid</div>
          <div className={`text-2xl font-bold ${
            completionPercentage === 100 ? 'text-success-green' : 'text-gold'
          } print:text-black`}>
            {completionPercentage}%
          </div>
          <div className="text-cream/50 text-xs mt-1 print:text-black">
            {isIncomplete ? 'nog niet volledig' : 'compleet'}
          </div>
        </div>
      </div>

      {/* Warning for incomplete data */}
      {isIncomplete && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 bg-warm-red/20 border border-warm-red/50 rounded-lg p-4 print:border-black"
        >
          <div className="flex items-start gap-3">
            <span className="text-warm-red text-xl print:text-black">⚠️</span>
            <div>
              <div className="text-warm-red font-semibold mb-1 print:text-black">
                Let op: Voorkeuren nog niet compleet
              </div>
              <div className="text-cream/80 text-sm print:text-black">
                {completionStatus.totalParticipants - completionStatus.completed} deelnemers hebben
                hun voorkeuren nog niet ingevuld. Het rapport is gebaseerd op de huidige data en kan
                nog wijzigen.
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
