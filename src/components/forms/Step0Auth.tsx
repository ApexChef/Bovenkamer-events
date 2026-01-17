'use client';

import { useState, useRef } from 'react';
import { useRegistrationStore } from '@/lib/store';
import { Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { PINInput, PINInputRef } from '@/components/ui/PINInput';
import { motion } from 'framer-motion';

export function Step0Auth() {
  const { formData, setFormData, nextStep } = useRegistrationStore();
  const pinInputRef = useRef<PINInputRef>(null);
  const confirmPinInputRef = useRef<PINInputRef>(null);

  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [confirmPinError, setConfirmPinError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPinError('');
    setConfirmPinError('');

    // Validation
    if (pin.length !== 4) {
      setPinError('PIN moet 4 karakters zijn');
      pinInputRef.current?.focus();
      return;
    }

    if (!/^[A-Z]{2}[0-9]{2}$/.test(pin)) {
      setPinError('PIN moet format XX## hebben (2 letters, 2 cijfers)');
      pinInputRef.current?.focus();
      return;
    }

    if (confirmPin !== pin) {
      setConfirmPinError('PINs komen niet overeen');
      confirmPinInputRef.current?.focus();
      return;
    }

    // Store PIN in form data (will be hashed on backend)
    setFormData({ pin });
    nextStep();
  };

  const isValid = pin.length === 4 && confirmPin === pin && /^[A-Z]{2}[0-9]{2}$/.test(pin);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Maak je persoonlijke PIN</CardTitle>
          <CardDescription>
            Kies een 4-karakter PIN om in te loggen (2 letters + 2 cijfers)
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-8">
            <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-gold flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-cream/90 font-semibold mb-1">
                    Wat is een PIN?
                  </p>
                  <p className="text-xs text-cream/70">
                    Je PIN bestaat uit 2 letters gevolgd door 2 cijfers (bijv. AB12, XY99).
                    Je gebruikt deze om later in te loggen op je persoonlijke dashboard.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <PINInput
                ref={pinInputRef}
                label="Kies je PIN"
                value={pin}
                onChange={(value) => {
                  setPin(value);
                  setPinError('');
                }}
                error={pinError}
                hint="Bijv. AB12, XY99 - Kies iets wat je kunt onthouden"
                autoFocus
              />
            </div>

            <div>
              <PINInput
                ref={confirmPinInputRef}
                label="Bevestig je PIN"
                value={confirmPin}
                onChange={(value) => {
                  setConfirmPin(value);
                  setConfirmPinError('');
                }}
                error={confirmPinError}
                hint="Voer dezelfde PIN nogmaals in"
              />
            </div>

            <div className="bg-warm-red/10 border border-warm-red/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-warm-red flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-warm-red font-semibold mb-1">
                    Bewaar je PIN goed!
                  </p>
                  <p className="text-xs text-cream/70">
                    Je hebt deze PIN nodig om in te loggen. Zorg dat je deze kunt onthouden
                    of bewaar deze op een veilige plek.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={!isValid}>
              Volgende stap
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
