'use client';

import { ReactNode } from 'react';
import { FeatureKey } from '@/types';
import { useFeature } from './FeatureProvider';

interface FeatureToggleProps {
  feature: FeatureKey;
  children: ReactNode;
  fallback?: ReactNode;
  showWhileLoading?: boolean;
}

/**
 * FeatureToggle - A wrapper component for feature flags
 *
 * Usage:
 * <FeatureToggle feature="show_countdown">
 *   <CountdownTimer />
 * </FeatureToggle>
 *
 * With fallback:
 * <FeatureToggle feature="show_burger_game" fallback={<DisabledMessage />}>
 *   <BurgerGame />
 * </FeatureToggle>
 */
export function FeatureToggle({
  feature,
  children,
  fallback = null,
  showWhileLoading = true,
}: FeatureToggleProps) {
  const { isEnabled, isLoading } = useFeature(feature);

  // While loading, optionally show children (default behavior)
  if (isLoading) {
    return showWhileLoading ? <>{children}</> : null;
  }

  // Feature is enabled - show children
  if (isEnabled) {
    return <>{children}</>;
  }

  // Feature is disabled - show fallback
  return <>{fallback}</>;
}

/**
 * withFeatureToggle - HOC for feature flags
 *
 * Usage:
 * const ProtectedComponent = withFeatureToggle(MyComponent, 'show_countdown');
 */
export function withFeatureToggle<P extends object>(
  Component: React.ComponentType<P>,
  feature: FeatureKey,
  FallbackComponent?: React.ComponentType
) {
  return function WrappedComponent(props: P) {
    const { isEnabled, isLoading } = useFeature(feature);

    if (isLoading) {
      return <Component {...props} />;
    }

    if (!isEnabled) {
      return FallbackComponent ? <FallbackComponent /> : null;
    }

    return <Component {...props} />;
  };
}
