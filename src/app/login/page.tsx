'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PINInput, PINInputRef } from '@/components/ui/PINInput';
import { useAuthStore, useRegistrationStore } from '@/lib/store';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  const { setComplete, setFormData } = useRegistrationStore();
  const pinInputRef = useRef<PINInputRef>(null);

  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [pinError, setPinError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPinError('');

    // Validation
    if (!email) {
      setEmailError('Email is verplicht');
      return;
    }
    if (!email.includes('@')) {
      setEmailError('Ongeldig email adres');
      return;
    }
    if (pin.length !== 4) {
      setPinError('PIN moet 4 karakters zijn (bijv. AB12)');
      return;
    }
    if (!/^[A-Z]{2}[0-9]{2}$/.test(pin)) {
      setPinError('PIN moet format XX## hebben (2 letters, 2 cijfers)');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error cases
        if (data.error === 'ACCOUNT_LOCKED') {
          setError(data.message);
          setPinError('Te veel mislukte pogingen');
        } else if (data.error === 'INVALID_CREDENTIALS') {
          setPinError('Onjuist email of PIN');
        } else if (data.error === 'EMAIL_NOT_VERIFIED') {
          setError('Email nog niet geverifieerd. Check je inbox.');
        } else if (data.error === 'REGISTRATION_REJECTED') {
          setError(`Registratie afgekeurd: ${data.details?.rejectionReason || 'Neem contact op met de organisatie.'}`);
        } else {
          setError(data.message || 'Er is iets misgegaan. Probeer opnieuw.');
        }
        return;
      }

      // Success - compute PIN hash for cache
      const encoder = new TextEncoder();
      const pinData = encoder.encode(pin);
      const hashBuffer = await crypto.subtle.digest('SHA-256', pinData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Store in auth store
      await login(data.user, data.token, pinHash);

      // Set registration store as complete (for dashboard access)
      setFormData({ email: data.user.email, name: data.user.name });
      setComplete(true);

      // Redirect based on registration status
      if (data.user.registrationStatus === 'pending') {
        router.push('/wachten-op-goedkeuring');
      } else if (data.user.registrationStatus === 'approved') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Netwerkfout. Controleer je internetverbinding.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-deep-green flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-gold mb-2">Inloggen</h1>
          <p className="text-cream/70">
            Log in met je email en persoonlijke PIN
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
              error={emailError}
              placeholder="jouw@email.nl"
              disabled={isLoading}
              autoComplete="email"
              autoFocus
            />

            <div>
              <PINInput
                ref={pinInputRef}
                label="Persoonlijke PIN"
                value={pin}
                onChange={setPin}
                error={pinError}
                hint="2 letters + 2 cijfers (bijv. AB12)"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
            >
              Inloggen
            </Button>

            <div className="text-center space-y-2">
              <Link
                href="/vergeet-pin"
                className="block text-sm text-gold hover:text-gold/80 transition-colors"
              >
                PIN vergeten?
              </Link>

              <div className="pt-4 border-t border-gold/20">
                <p className="text-sm text-cream/70 mb-2">
                  Nog geen account?
                </p>
                <Link href="/register">
                  <Button variant="secondary" size="md" className="w-full">
                    Registreer nu
                  </Button>
                </Link>
              </div>
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
