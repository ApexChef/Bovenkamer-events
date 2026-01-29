'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button, Card, CardContent, CardFooter } from '@/components/ui';
import { DynamicForm } from '@/components/forms/dynamic';

export default function RateV2Page() {
  const [email, setEmail] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

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

  if (!isStarted) {
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

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card>
              <CardContent className="py-8 space-y-4">
                <label className="block">
                  <span className="text-cream font-medium">Uw Email</span>
                  <span className="text-cream/50 text-sm block mb-2">Voor identificatie van uw beoordeling</span>
                  <input
                    type="email"
                    className="w-full px-4 py-3 bg-dark-wood border border-gold/20 rounded-lg text-cream placeholder:text-cream/30 focus:outline-none focus:border-gold/60"
                    placeholder="uw@email.nl"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </label>
                <Button
                  onClick={() => setIsStarted(true)}
                  disabled={!email.trim()}
                  className="w-full"
                >
                  Start Beoordeling
                </Button>
              </CardContent>
            </Card>
          </motion.div>
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
          email={email}
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
