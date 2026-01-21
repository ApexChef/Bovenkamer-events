'use client';

import { ReactNode } from 'react';
import { FeatureProvider } from './FeatureProvider';

interface ProvidersProps {
  children: ReactNode;
}

/**
 * Providers - Client-side providers wrapper
 *
 * Wraps all client-side context providers for the application.
 * Used in the root layout to provide global context.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <FeatureProvider>
      {children}
    </FeatureProvider>
  );
}
