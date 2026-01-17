'use client';

import { useRegistrationStore } from '@/lib/store';
import { ProgressSteps } from '@/components/ui';
import { Step0Auth, Step1Personal, Step2Skills, Step3Quiz, Step4Assignment } from '@/components/forms';
import { AnimatePresence } from 'framer-motion';
import Link from 'next/link';

const STEPS = [
  { number: 0, title: 'PIN' },
  { number: 1, title: 'Gegevens' },
  { number: 2, title: 'Capaciteiten' },
  { number: 3, title: 'Quiz' },
  { number: 4, title: 'Toewijzing' },
];

export default function RegisterPage() {
  const { currentStep } = useRegistrationStore();

  return (
    <main className="min-h-screen py-8 px-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 border border-gold/10 rounded-full" />
        <div className="absolute bottom-20 right-20 w-48 h-48 border border-gold/10 rounded-full" />
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-gold mb-2">
              Bovenkamer Winterproef
            </h1>
          </Link>
          <p className="text-cream/60">Registratie 2026</p>
        </div>

        {/* Progress Steps */}
        <ProgressSteps steps={STEPS} currentStep={currentStep} />

        {/* Form Steps */}
        <div className="mt-12">
          <AnimatePresence mode="wait">
            {currentStep === 0 && <Step0Auth key="step0" />}
            {currentStep === 1 && <Step1Personal key="step1" />}
            {currentStep === 2 && <Step2Skills key="step2" />}
            {currentStep === 3 && <Step3Quiz key="step3" />}
            {currentStep === 4 && <Step4Assignment key="step4" />}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-cream/30 text-xs">
            Uw gegevens worden vertrouwelijk behandeld door de commissie
          </p>
        </div>
      </div>
    </main>
  );
}
