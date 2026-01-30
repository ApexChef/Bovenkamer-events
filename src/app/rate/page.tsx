'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, CardFooter } from '@/components/ui';
import { DynamicForm } from '@/components/forms/dynamic';
import { useAuthStore } from '@/lib/store';

export default function RatePage() {
  const { currentUser } = useAuthStore();
  const [isSubmitted, setIsSubmitted] = useState(false);

  if (!currentUser) {
    return (
      <main className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Card>
            <CardContent className="py-12">
              <h2 className="font-display text-2xl text-gold mb-4">Niet ingelogd</h2>
              <p className="text-cream/60 mb-6">Log in om een beoordeling in te dienen.</p>
              <Link href="/login">
                <Button>Inloggen</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (isSubmitted) {
    return (
      <main className="min-h-screen py-8 px-4">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-success-green rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-cream" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-display text-2xl text-gold mb-2">Beoordeling Ingediend</h2>
              <p className="text-cream/60 mb-6">
                Uw stem is geregistreerd. De resultaten worden na de BBQ bekendgemaakt.
              </p>
              <Link href="/">
                <Button>Terug naar Home</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <span className="stamp text-xs mb-4 inline-block">BEOORDELING</span>
          <h1 className="font-display text-3xl font-bold text-gold mb-2">
            Boy Boom Winterproef
          </h1>
          <p className="text-cream/60">Is de kandidaat waardig?</p>
        </div>

        <DynamicForm
          formKey="ratings"
          email={currentUser.email}
          onSubmitSuccess={() => setIsSubmitted(true)}
          renderFooter={({ isValid, isLoading, onSubmit }) => (
            <CardFooter className="flex justify-between px-0">
              <Link href="/">
                <Button type="button" variant="ghost">
                  Terug
                </Button>
              </Link>
              <Button
                onClick={onSubmit}
                isLoading={isLoading}
                disabled={!isValid}
              >
                Beoordeling Indienen
              </Button>
            </CardFooter>
          )}
        />
      </div>
    </main>
  );
}
