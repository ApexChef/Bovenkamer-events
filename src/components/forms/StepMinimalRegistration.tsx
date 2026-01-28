'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useRegistrationStore, useAuthStore } from '@/lib/store';
import { Input, Button, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui';
import { PINInput, PINInputRef } from '@/components/ui/PINInput';
import { motion } from 'framer-motion';

export function StepMinimalRegistration() {
  const router = useRouter();
  const { formData, setFormData, setComplete, markSectionComplete } = useRegistrationStore();
  const { login } = useAuthStore();
  const pinInputRef = useRef<PINInputRef>(null);
  const confirmPinInputRef = useRef<PINInputRef>(null);

  const [firstName, setFirstName] = useState(formData.firstName || '');
  const [lastName, setLastName] = useState(formData.lastName || '');
  const [email, setEmail] = useState(formData.email || '');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [firstNameError, setFirstNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [pinError, setPinError] = useState('');
  const [confirmPinError, setConfirmPinError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Reset errors
    setFirstNameError('');
    setEmailError('');
    setPinError('');
    setConfirmPinError('');
    setGeneralError('');

    // Validation
    let hasError = false;

    if (!firstName.trim()) {
      setFirstNameError('Voornaam is verplicht');
      hasError = true;
    }

    // Achternaam is optioneel bij registratie

    if (!email.trim()) {
      setEmailError('E-mail is verplicht');
      hasError = true;
    } else if (!email.includes('@')) {
      setEmailError('Ongeldig e-mailadres');
      hasError = true;
    }

    if (pin.length !== 4) {
      setPinError('PIN moet 4 karakters zijn');
      hasError = true;
    } else if (!/^[A-Z]{2}[0-9]{2}$/.test(pin)) {
      setPinError('PIN moet format XX## hebben (2 letters, 2 cijfers)');
      hasError = true;
    }

    if (confirmPin !== pin) {
      setConfirmPinError('PINs komen niet overeen');
      hasError = true;
    }

    if (hasError) return;

    setIsLoading(true);

    try {
      // Register the user with minimal data
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          name: fullName, // For backward compatibility
          email: email.trim().toLowerCase(),
          pin,
          minimal: true, // Flag for minimal registration
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'EMAIL_EXISTS') {
          setEmailError('Dit e-mailadres is al geregistreerd');
        } else {
          setGeneralError(data.message || 'Er is iets misgegaan');
        }
        return;
      }

      // Success - compute PIN hash for cache
      const encoder = new TextEncoder();
      const pinData = encoder.encode(pin);
      const hashBuffer = await crypto.subtle.digest('SHA-256', pinData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Store in auth and registration stores
      await login(data.user, data.token, pinHash);
      setFormData({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: fullName,
        email: email.trim().toLowerCase(),
        pin
      });
      markSectionComplete('basic');
      setComplete(true);

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      setGeneralError('Netwerkfout. Controleer je internetverbinding.');
    } finally {
      setIsLoading(false);
    }
  };

  // Only firstName is required, lastName is optional
  const isValid =
    firstName.trim() !== '' &&
    email.trim() !== '' &&
    email.includes('@') &&
    pin.length === 4 &&
    /^[A-Z]{2}[0-9]{2}$/.test(pin) &&
    confirmPin === pin;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Snel Aanmelden</CardTitle>
          <CardDescription>
            Meld je aan met alleen je naam, e-mail en een PIN
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {generalError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 bg-warm-red/20 border border-warm-red rounded-lg"
              >
                <p className="text-sm text-warm-red">{generalError}</p>
              </motion.div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Voornaam"
                placeholder="Je voornaam"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  setFirstNameError('');
                }}
                error={firstNameError}
                disabled={isLoading}
                autoFocus
              />

              <Input
                label="Achternaam (optioneel)"
                placeholder="Je achternaam"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                }}
                disabled={isLoading}
              />
            </div>

            <Input
              label="E-mailadres"
              type="email"
              placeholder="jouw@email.nl"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailError('');
              }}
              error={emailError}
              disabled={isLoading}
            />

            <div className="pt-4 border-t border-gold/10">
              <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mb-6">
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
                      Kies een PIN
                    </p>
                    <p className="text-xs text-cream/70">
                      Je PIN bestaat uit 2 letters gevolgd door 2 cijfers (bijv. AB12).
                      Je gebruikt deze om later in te loggen.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <PINInput
                  ref={pinInputRef}
                  label="Kies je PIN"
                  value={pin}
                  onChange={(value) => {
                    setPin(value);
                    setPinError('');
                  }}
                  error={pinError}
                  hint="Bijv. AB12, XY99"
                  disabled={isLoading}
                />

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
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="bg-success-green/10 border border-success-green/30 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-success-green flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-success-green font-semibold mb-1">
                    Vul later je profiel aan voor extra punten!
                  </p>
                  <p className="text-xs text-cream/70">
                    Na aanmelding kun je je profiel verder aanvullen en daarmee extra punten verdienen
                    voor het leaderboard.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-end">
            <Button type="submit" disabled={!isValid || isLoading} isLoading={isLoading}>
              Aanmelden
            </Button>
          </CardFooter>
        </form>
      </Card>
    </motion.div>
  );
}
