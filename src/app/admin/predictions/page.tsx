'use client';

import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { Card, CardContent } from '@/components/ui';

export default function AdminPredictionsPage() {
  return (
    <AuthGuard requireAdmin requireApproved>
      <AdminPredictionsContent />
    </AuthGuard>
  );
}

function AdminPredictionsContent() {
  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Link href="/admin" className="text-gold hover:text-gold/80 text-sm mb-4 inline-block">
          &larr; Terug naar admin dashboard
        </Link>

        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h1 className="font-display text-2xl font-bold text-gold mb-2">
              Voorspellingen
            </h1>
            <p className="text-cream/60 mb-6">
              Coming soon - Hier kun je straks de uitkomsten van voorspellingen invullen.
            </p>
            <Link
              href="/predictions"
              className="text-gold hover:underline text-sm"
            >
              Bekijk voorspellingen pagina →
            </Link>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
