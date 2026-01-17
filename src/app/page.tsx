'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/store';

export default function Home() {
  const { isAuthenticated } = useAuthStore();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 border border-gold/10 rounded-full" />
        <div className="absolute bottom-20 right-20 w-48 h-48 border border-gold/10 rounded-full" />
        <div className="absolute top-1/2 left-1/4 w-24 h-24 border border-gold/5 rounded-full" />
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        {/* Stamp */}
        <div className="mb-8">
          <span className="stamp text-sm tracking-widest animate-glow">
            Anno 2026
          </span>
        </div>

        {/* Title */}
        <h1 className="font-display text-5xl md:text-7xl font-bold text-gold mb-4 tracking-tight">
          Bovenkamer
        </h1>
        <h2 className="font-display text-3xl md:text-4xl italic text-cream/80 mb-8">
          Winterproef
        </h2>

        {/* Decorative line */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <div className="h-px w-16 bg-gold/50" />
          <div className="w-2 h-2 bg-gold rotate-45" />
          <div className="h-px w-16 bg-gold/50" />
        </div>

        {/* Description */}
        <p className="text-cream/70 text-lg mb-4 leading-relaxed">
          Het collectief nodigt u uit voor de jaarlijkse beproeving
        </p>
        <p className="text-cream/90 text-xl font-semibold mb-8">
          Nieuwjaars BBQ — 24 januari 2026
        </p>

        {/* Card */}
        <div className="card mb-8 animate-float">
          <p className="text-gold/80 text-sm uppercase tracking-widest mb-2">
            Ter beoordeling voorgelegd
          </p>
          <p className="font-display text-2xl text-cream">
            Kandidaat <span className="text-gold">Boy Boom</span>
          </p>
        </div>

        {/* Registration CTA */}
        <div className="mb-8">
          {isAuthenticated ? (
            <>
              <Link
                href="/dashboard"
                className="inline-block bg-gold text-dark-wood font-semibold uppercase tracking-wider px-8 py-4 rounded-lg hover:bg-gold/90 transition-all duration-200 transform hover:scale-105"
              >
                Naar Dashboard
              </Link>
              <p className="text-cream/50 text-sm mt-3">
                Bekijk uw toewijzing en status
              </p>
            </>
          ) : (
            <>
              <Link
                href="/register"
                className="inline-block bg-gold text-dark-wood font-semibold uppercase tracking-wider px-8 py-4 rounded-lg hover:bg-gold/90 transition-all duration-200 transform hover:scale-105"
              >
                Registreer Nu
              </Link>
              <p className="text-cream/50 text-sm mt-3">
                Meld u aan voor het festijn en ontvang uw toewijzing
              </p>
            </>
          )}
        </div>

        {/* Features preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-4 border border-gold/20 rounded hover:border-gold/40 transition-colors">
            <p className="text-gold mb-1">Registratie</p>
            <p className="text-cream/50">Meld u aan voor het festijn</p>
          </div>
          <div className="p-4 border border-gold/20 rounded hover:border-gold/40 transition-colors">
            <p className="text-gold mb-1">Voorspellingen</p>
            <p className="text-cream/50">Waag uw gok</p>
          </div>
          <div className="p-4 border border-gold/20 rounded hover:border-gold/40 transition-colors">
            <p className="text-gold mb-1">Live Quiz</p>
            <p className="text-cream/50">Bewijs uw kennis</p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gold/10">
          <p className="text-cream/30 text-xs uppercase tracking-widest">
            Alumni Junior Kamer Venray
          </p>
        </div>
      </div>
    </main>
  )
}
