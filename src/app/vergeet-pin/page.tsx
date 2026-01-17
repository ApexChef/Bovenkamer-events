'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function ForgotPINPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Email is verplicht');
      return;
    }
    if (!email.includes('@')) {
      setError('Ongeldig email adres');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'USER_NOT_FOUND') {
          // Don't reveal if email exists or not (security best practice)
          setIsSuccess(true);
        } else if (data.error === 'RATE_LIMIT_EXCEEDED') {
          setError('Te veel aanvragen. Probeer over een paar minuten opnieuw.');
        } else {
          setError(data.message || 'Er is iets misgegaan. Probeer opnieuw.');
        }
        return;
      }

      setIsSuccess(true);
    } catch (err) {
      console.error('Reset PIN error:', err);
      setError('Netwerkfout. Controleer je internetverbinding.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-deep-green flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-success-green/20 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-success-green"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-serif text-gold">
                Check je email
              </h1>

              <p className="text-cream/70">
                Als er een account bestaat met dit email adres, hebben we een
                link gestuurd om je PIN te resetten.
              </p>

              <p className="text-sm text-cream/50">
                De link is 24 uur geldig.
              </p>

              <div className="pt-4">
                <Link href="/login">
                  <Button variant="primary" size="md" className="w-full">
                    Terug naar inloggen
                  </Button>
                </Link>
              </div>
            </div>
          </Card>

          <div className="mt-6 text-center">
            <p className="text-xs text-cream/50">
              Geen email ontvangen? Check je spam folder.
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-deep-green flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-gold mb-2">PIN vergeten</h1>
          <p className="text-cream/70">
            Voer je email adres in om je PIN te resetten
          </p>
        </div>

        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-warm-red/20 border border-warm-red rounded-lg"
              >
                <p className="text-sm text-warm-red">{error}</p>
              </motion.div>
            )}

            <Input
              type="email"
              label="Email adres"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jouw@email.nl"
              disabled={isLoading}
              autoComplete="email"
              autoFocus
              hint="We sturen een reset link naar dit adres"
            />

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Reset link versturen
            </Button>

            <div className="text-center">
              <Link
                href="/login"
                className="text-sm text-gold hover:text-gold/80 transition-colors"
              >
                Terug naar inloggen
              </Link>
            </div>
          </form>
        </Card>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-sm text-cream/50 hover:text-cream/70 transition-colors"
          >
            Terug naar home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
