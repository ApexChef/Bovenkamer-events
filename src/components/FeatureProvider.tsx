'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { FeatureFlags, FeatureKey, DEFAULT_FEATURES } from '@/types';

interface FeatureContextType {
  features: FeatureFlags;
  isLoading: boolean;
  isEnabled: (feature: FeatureKey) => boolean;
  refresh: () => Promise<void>;
}

const FeatureContext = createContext<FeatureContextType | undefined>(undefined);

export function FeatureProvider({ children }: { children: ReactNode }) {
  const [features, setFeatures] = useState<FeatureFlags>(DEFAULT_FEATURES);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeatures = async () => {
    try {
      const response = await fetch('/api/features');
      if (response.ok) {
        const data = await response.json();
        setFeatures(data.features || DEFAULT_FEATURES);
      }
    } catch (error) {
      console.error('Failed to fetch features:', error);
      // Keep default features on error
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, []);

  const isEnabled = (feature: FeatureKey): boolean => {
    return features[feature] ?? DEFAULT_FEATURES[feature];
  };

  const refresh = async () => {
    setIsLoading(true);
    await fetchFeatures();
  };

  return (
    <FeatureContext.Provider value={{ features, isLoading, isEnabled, refresh }}>
      {children}
    </FeatureContext.Provider>
  );
}

// Hook to use feature flags
export function useFeatures() {
  const context = useContext(FeatureContext);
  if (context === undefined) {
    throw new Error('useFeatures must be used within a FeatureProvider');
  }
  return context;
}

// Hook for a single feature
export function useFeature(feature: FeatureKey) {
  const { isEnabled, isLoading } = useFeatures();
  return {
    isEnabled: isEnabled(feature),
    isLoading,
  };
}
