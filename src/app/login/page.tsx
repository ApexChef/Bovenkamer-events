'use client';

import { Suspense, useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PINInput, PINInputRef } from '@/components/ui/PINInput';
import { useAuthStore, useRegistrationStore, usePredictionsStore } from '@/lib/store';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');
  const prefillEmail = searchParams.get('un'); // Pre-fill email from query param
  const { login } = useAuthStore();
  const { setComplete, setFormData, setAIAssignment, setCompletedSections, reset: resetRegistration, setAttendance, setHasHydrated: setRegistrationHydrated } = useRegistrationStore();
  const { reset: resetPredictions } = usePredictionsStore();
  const pinInputRef = useRef<PINInputRef>(null);

  const [email, setEmail] = useState('');
  const [pin, setPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [pinError, setPinError] = useState('');
  const [rememberEmail, setRememberEmail] = useState(true);

  // Load email from query param or localStorage on mount
  useEffect(() => {
    // Query param takes precedence
    if (prefillEmail) {
      setEmail(prefillEmail);
      // Focus on PIN input if email is pre-filled
      setTimeout(() => pinInputRef.current?.focus(), 100);
      return;
    }

    // Otherwise check localStorage
    const savedEmail = localStorage.getItem('bovenkamer_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      // Focus on PIN input if email is pre-filled
      setTimeout(() => pinInputRef.current?.focus(), 100);
    }
  }, [prefillEmail]);

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

      // Success - save or clear remembered email
      if (rememberEmail) {
        localStorage.setItem('bovenkamer_remembered_email', email);
      } else {
        localStorage.removeItem('bovenkamer_remembered_email');
      }

      // IMPORTANT: Reset all stores BEFORE loading new user data
      // This clears any data from a previous user session
      resetRegistration();
      resetPredictions();

      // Compute PIN hash for cache
      const encoder = new TextEncoder();
      const pinData = encoder.encode(pin);
      const hashBuffer = await crypto.subtle.digest('SHA-256', pinData);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const pinHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      // Store in auth store (synchronous - updates state and localStorage)
      login(data.user, data.token, pinHash);

      // Restore registration data including AI assignment (for dashboard access)
      if (data.registration) {
        const reg = data.registration;
        const defaultSkills = {
          food_prep: '',
          bbq_grill: '',
          drinks: '',
          entertainment: '',
          atmosphere: '',
          social: '',
          cleanup: '',
          documentation: '',
        };

        setFormData({
          email: data.user.email,
          name: data.user.name,
          birthDate: reg.birthDate || '',
          birthYear: reg.birthYear,
          hasPartner: reg.hasPartner,
          partnerName: reg.partnerName || '',
          dietaryRequirements: reg.dietaryRequirements || '',
          skills: reg.skills || defaultSkills,
          additionalSkills: reg.additionalSkills || '',
          musicDecade: reg.musicDecade || '',
          musicGenre: reg.musicGenre || '',
          quizAnswers: reg.quizAnswers || {},
          jkvJoinYear: reg.jkvJoinYear || null,
          jkvExitYear: reg.jkvExitYear || null,
          bovenkamerJoinYear: reg.bovenkamerJoinYear || null,
          borrelCount2025: reg.borrelCount2025 || 0,
          borrelPlanning2026: reg.borrelPlanning2026 || 0,
        });

        // Only sync attendance if user has explicitly answered (check if personal section is complete)
        // A user who filled the personal section will have birthYear set
        if (reg.birthYear && reg.hasPartner !== undefined && reg.hasPartner !== null) {
          setAttendance({
            confirmed: true,
            bringingPlusOne: reg.hasPartner,
            plusOneName: reg.partnerName || '',
          });
        }
        // Otherwise leave attendance as null so the dashboard shows the question

        if (reg.aiAssignment) {
          setAIAssignment(reg.aiAssignment);
        }
      } else {
        setFormData({ email: data.user.email, name: data.user.name });
      }

      // Fetch completedSections and attendance from profile API
      try {
        const profileResponse = await fetch(`/api/profile?email=${encodeURIComponent(data.user.email)}`);
        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          if (profileData.completedSections) {
            setCompletedSections({
              basic: !!profileData.completedSections.basic,
              personal: !!profileData.completedSections.personal,
              skills: !!profileData.completedSections.skills,
              music: !!profileData.completedSections.music,
              jkvHistorie: !!profileData.completedSections.jkvHistorie,
              borrelStats: !!profileData.completedSections.borrelStats,
              quiz: !!profileData.completedSections.quiz,
            });
          }
          // Restore attendance from database if it was explicitly set
          if (profileData.profile?.attendanceConfirmed !== undefined && profileData.profile?.attendanceConfirmed !== null) {
            setAttendance({
              confirmed: profileData.profile.attendanceConfirmed,
              bringingPlusOne: profileData.profile.hasPartner ?? null,
              plusOneName: profileData.profile.partnerName || '',
            });
          }
        }
      } catch (profileError) {
        console.error('Error fetching profile for completedSections:', profileError);
        // Fallback: at least mark basic as complete
        setCompletedSections({ basic: true });
      }
      setComplete(true);

      // Explicitly set hydration flag to true - this is needed because after
      // resetRegistration(), the onRehydrateStorage callback won't be called again
      // during client-side navigation, leaving _hasHydrated in an undefined state
      setRegistrationHydrated(true);

      // Wait for Zustand persist middleware to save state to localStorage
      // We poll localStorage to ensure the data is actually persisted before redirecting
      // This prevents race conditions where the redirect happens before state is persisted
      const maxWaitTime = 2000; // Max 2 seconds
      const pollInterval = 50;  // Check every 50ms
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitTime) {
        try {
          const registrationData = localStorage.getItem('bovenkamer-registration');
          const authData = localStorage.getItem('bovenkamer-auth');

          if (registrationData && authData) {
            const regParsed = JSON.parse(registrationData);
            const authParsed = JSON.parse(authData);

            // Check if both stores are properly persisted with correct user data
            const registrationReady = regParsed.state?.isComplete === true &&
                                       regParsed.state?.formData?.email === data.user.email;
            const authReady = authParsed.state?.isAuthenticated === true &&
                              authParsed.state?.currentUser?.email === data.user.email;

            if (registrationReady && authReady) {
              break; // Both stores are properly persisted
            }
          }
        } catch {
          // JSON parse error, continue waiting
        }
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }

      // Redirect to intended destination or default based on status
      if (data.user.registrationStatus === 'pending') {
        router.push('/wachten-op-goedkeuring');
      } else if (data.user.registrationStatus === 'approved') {
        // Use redirect URL if provided, otherwise go to dashboard
        router.push(redirectUrl || '/dashboard');
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
              autoFocus={!email}
            />

            <label className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={rememberEmail}
                onChange={(e) => setRememberEmail(e.target.checked)}
                className="w-4 h-4 rounded border-gold/30 bg-dark-wood text-gold focus:ring-gold/50 focus:ring-offset-0 cursor-pointer"
              />
              <span className="text-sm text-cream/70 group-hover:text-cream/90 transition-colors">
                Onthoud mijn email
              </span>
            </label>

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

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-deep-green flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
