'use client';

import { StepMinimalRegistration } from '@/components/forms';
import Link from 'next/link';

export default function RegisterPage() {
  return (
    <main className="min-h-screen py-8 px-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 border border-gold/10 rounded-full" />
        <div className="absolute bottom-20 right-20 w-48 h-48 border border-gold/10 rounded-full" />
      </div>

      <div className="relative z-10 max-w-md mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="font-display text-3xl md:text-4xl font-bold text-gold mb-2">
              Bovenkamer Winterproef
            </h1>
          </Link>
          <p className="text-cream/60">Snel aanmelden</p>
        </div>

        {/* Minimal Registration Form */}
        <StepMinimalRegistration />

        {/* Login link */}
        <div className="mt-6 text-center">
          <p className="text-cream/50 text-sm">
            Al geregistreerd?{' '}
            <Link href="/login" className="text-gold hover:text-gold/80 underline">
              Log in
            </Link>
          </p>
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
