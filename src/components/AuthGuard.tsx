'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { motion } from 'framer-motion';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireApproved?: boolean;
  requireVerified?: boolean;
  redirectTo?: string;
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requireAdmin = false,
  requireApproved = false,
  requireVerified = false,
  redirectTo = '/login',
  fallback,
}: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, currentUser, isCheckingAuth, checkSession } = useAuthStore();
  const [isReady, setIsReady] = useState(false);
  const hasChecked = useRef(false);

  useEffect(() => {
    // Only run once
    if (hasChecked.current) return;
    hasChecked.current = true;

    const verifyAuth = async () => {
      // Check localStorage cache
      const isValid = await checkSession();

      if (!isValid) {
        // Pass current path as redirect parameter so user returns here after login
        const loginUrl = `${redirectTo}?redirect=${encodeURIComponent(pathname)}`;
        router.push(loginUrl);
        return;
      }

      setIsReady(true);
    };

    verifyAuth();
  }, []); // Empty dependency array - run once on mount

  // Additional role/status checks after session is validated
  useEffect(() => {
    if (!isReady || !currentUser) return;

    if (requireAdmin && currentUser.role !== 'admin') {
      router.push('/dashboard');
      return;
    }

    if (requireApproved && currentUser.registrationStatus !== 'approved') {
      router.push('/wachten-op-goedkeuring');
      return;
    }

    if (requireVerified && !currentUser.emailVerified) {
      router.push('/email-verificatie-vereist');
      return;
    }
  }, [isReady, currentUser, requireAdmin, requireApproved, requireVerified, router]);

  // Show loading state while checking auth
  if (isCheckingAuth || !isReady) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen bg-deep-green flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-gold/20 border-t-gold rounded-full animate-spin mx-auto mb-4" />
          <p className="text-cream/70 text-sm uppercase tracking-wider">
            Authenticatie controleren...
          </p>
        </motion.div>
      </div>
    );
  }

  // If authenticated and all checks pass, render children
  if (isAuthenticated && currentUser) {
    return <>{children}</>;
  }

  // Fallback: should not reach here due to redirect, but just in case
  return null;
}
