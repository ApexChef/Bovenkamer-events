'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function EmailVerificationPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [isVerifying, setIsVerifying] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const response = await fetch(`/api/auth/verify-email?token=${token}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (response.ok) {
          setIsSuccess(true);
          setUserEmail(data.email || '');

          // Automatically redirect after 5 seconds
          setTimeout(() => {
            router.push('/login');
          }, 5000);
        } else {
          setIsSuccess(false);
          if (data.error === 'INVALID_TOKEN') {
            setError('Ongeldige of verlopen verificatie link');
          } else if (data.error === 'ALREADY_VERIFIED') {
            setError('Email is al geverifieerd. Je kunt inloggen.');
          } else {
            setError(data.message || 'Verificatie mislukt');
          }
        }
      } catch (err) {
        console.error('Email verification error:', err);
        setError('Netwerkfout bij verificatie');
        setIsSuccess(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyEmail();
  }, [token, router]);

  // Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen bg-deep-green flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cream/70 text-sm uppercase tracking-wider">
            Email verificatie controleren...
          </p>
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
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="w-20 h-20 bg-success-green/20 rounded-full flex items-center justify-center mx-auto"
              >
                <svg
                  className="w-10 h-10 text-success-green"
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
              </motion.div>

              <h1 className="text-3xl font-serif text-gold">
                Email geverifieerd!
              </h1>

              {userEmail && (
                <p className="text-cream/70">
                  Je email adres <strong className="text-gold">{userEmail}</strong> is
                  succesvol geverifieerd.
                </p>
              )}

              <div className="bg-gold/10 border border-gold/30 rounded-lg p-4">
                <p className="text-sm text-cream/70">
                  Je registratie wordt nu beoordeeld door een beheerder.
                  Je ontvangt een email zodra je account is goedgekeurd.
                </p>
              </div>

              <p className="text-xs text-cream/50">
                Je wordt automatisch doorgestuurd naar de login pagina...
              </p>

              <div className="pt-4 space-y-2">
                <Link href="/login">
                  <Button variant="primary" size="md" className="w-full">
                    Nu inloggen
                  </Button>
                </Link>
              </div>
            </div>
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

  // Error state
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
              Verificatie mislukt
            </h1>

            <p className="text-cream/70">{error}</p>

            <div className="pt-4 space-y-2">
              {error.includes('verlopen') && (
                <>
                  <p className="text-sm text-cream/50 mb-4">
                    Verificatie links zijn 24 uur geldig.
                  </p>
                  <Button
                    variant="primary"
                    size="md"
                    className="w-full"
                    onClick={async () => {
                      // TODO: Call resend verification endpoint
                      alert('Nieuwe verificatie email versturen wordt binnenkort toegevoegd');
                    }}
                  >
                    Nieuwe verificatie email versturen
                  </Button>
                </>
              )}

              {error.includes('al geverifieerd') && (
                <Link href="/login">
                  <Button variant="primary" size="md" className="w-full">
                    Inloggen
                  </Button>
                </Link>
              )}

              {!error.includes('verlopen') && !error.includes('al geverifieerd') && (
                <Link href="/register">
                  <Button variant="primary" size="md" className="w-full">
                    Opnieuw registreren
                  </Button>
                </Link>
              )}

              <Link href="/">
                <Button variant="secondary" size="md" className="w-full">
                  Terug naar home
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
