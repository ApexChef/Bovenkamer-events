'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PINInput, PINInputRef } from '@/components/ui/PINInput';

export default function ResetPINPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const pinInputRef = useRef<PINInputRef>(null);
  const confirmPinInputRef = useRef<PINInputRef>(null);

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [pinError, setPinError] = useState('');
  const [confirmPinError, setConfirmPinError] = useState('');

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        const response = await fetch(`/api/auth/reset-pin/${token}`, {
          method: 'GET',
        });

        if (response.ok) {
          setIsValidToken(true);
        } else {
          setIsValidToken(false);
          const data = await response.json();
          setError(data.message || 'Ongeldige of verlopen reset link');
        }
      } catch (err) {
        console.error('Token validation error:', err);
        setError('Netwerkfout bij valideren van reset link');
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setPinError('');
    setConfirmPinError('');

    // Validation
    if (pin.length !== 4) {
      setPinError('PIN moet 4 karakters zijn');
      return;
    }
    if (!/^[A-Z]{2}[0-9]{2}$/.test(pin)) {
      setPinError('PIN moet format XX## hebben (2 letters, 2 cijfers)');
      return;
    }
    if (confirmPin !== pin) {
      setConfirmPinError('PINs komen niet overeen');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/auth/reset-pin/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'INVALID_TOKEN') {
          setError('Ongeldige of verlopen reset link');
        } else if (data.error === 'VALIDATION_ERROR') {
          setPinError(data.fields?.pin || 'Ongeldige PIN format');
        } else {
          setError(data.message || 'Er is iets misgegaan. Probeer opnieuw.');
        }
        return;
      }

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err) {
      console.error('Reset PIN error:', err);
      setError('Netwerkfout. Controleer je internetverbinding.');
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state while validating token
  if (isValidating) {
    return (
      <div className="min-h-screen bg-deep-green flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cream/70 text-sm uppercase tracking-wider">
            Reset link valideren...
          </p>
        </motion.div>
      </div>
    );
  }

  // Invalid token
  if (!isValidToken) {
    return (
      <div className="min-h-screen bg-deep-green flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md"
        >
          <Card>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-warm-red/20 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-warm-red"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>

              <h1 className="text-2xl font-serif text-gold">
                Ongeldige reset link
              </h1>

              <p className="text-cream/70">{error}</p>

              <p className="text-sm text-cream/50">
                Reset links zijn 24 uur geldig. Vraag een nieuwe aan als deze verlopen is.
              </p>

              <div className="pt-4 space-y-2">
                <Link href="/vergeet-pin">
                  <Button variant="primary" size="md" className="w-full">
                    Nieuwe reset link aanvragen
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="secondary" size="md" className="w-full">
                    Terug naar inloggen
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Success state
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
                PIN succesvol gereset!
              </h1>

              <p className="text-cream/70">
                Je kunt nu inloggen met je nieuwe PIN.
              </p>

              <p className="text-sm text-cream/50">
                Je wordt automatisch doorgestuurd naar de login pagina...
              </p>

              <div className="pt-4">
                <Link href="/login">
                  <Button variant="primary" size="md" className="w-full">
                    Nu inloggen
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-deep-green flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif text-gold mb-2">Nieuwe PIN instellen</h1>
          <p className="text-cream/70">
            Kies een nieuwe PIN met 2 letters en 2 cijfers
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

            <div>
              <PINInput
                ref={pinInputRef}
                label="Nieuwe PIN"
                value={pin}
                onChange={setPin}
                error={pinError}
                hint="Bijv. AB12, XY99"
                disabled={isLoading}
                autoFocus
              />
            </div>

            <div>
              <PINInput
                ref={confirmPinInputRef}
                label="Bevestig PIN"
                value={confirmPin}
                onChange={setConfirmPin}
                error={confirmPinError}
                hint="Voer dezelfde PIN nogmaals in"
                disabled={isLoading}
              />
            </div>

            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
              <p className="text-xs text-cream/70">
                <strong className="text-gold">Let op:</strong> Bewaar je PIN goed.
                Je hebt deze nodig om in te loggen.
              </p>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isLoading}
              disabled={pin.length !== 4 || confirmPin.length !== 4}
            >
              PIN resetten
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
      </motion.div>
    </div>
  );
}
