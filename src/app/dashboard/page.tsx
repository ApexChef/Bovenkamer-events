'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRegistrationStore, usePredictionsStore, useAuthStore } from '@/lib/store';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { HomeTab, PredictionsTab, LeaderboardTab, MiniLeaderboard } from '@/components/dashboard';
import { FeatureToggle } from '@/components/FeatureToggle';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  points: number;
}

interface LeaderboardData {
  leaderboard: LeaderboardEntry[];
  totalParticipants: number;
  currentUser: { points: number; rank: number } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { formData, aiAssignment, isComplete, setFormData, setCompletedSections, _hasHydrated: registrationHydrated, getProfileCompletion } = useRegistrationStore();
  const { isSubmitted: predictionsSubmitted } = usePredictionsStore();
  const { isAuthenticated, _hasHydrated: authHydrated } = useAuthStore();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [profileSynced, setProfileSynced] = useState(false);

  // Track client-side mount
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Redirect if not authenticated or not registered (only after mount and hydration)
  useEffect(() => {
    // Wait for client-side mount and BOTH stores to hydrate before checking
    if (!isMounted || !registrationHydrated || !authHydrated) return;

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.push('/login?redirect=/dashboard');
      return;
    }

    // If authenticated but registration not complete, redirect to register
    if (!isComplete) {
      router.push('/register');
    }
  }, [isMounted, registrationHydrated, authHydrated, isComplete, isAuthenticated, router]);

  // Sync profile data from database on dashboard load
  const syncProfileFromDb = useCallback(async () => {
    if (!formData.email || profileSynced) return;

    try {
      const response = await fetch(`/api/profile?email=${encodeURIComponent(formData.email)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.profile) {
          // Update store with fresh data from database
          setFormData(data.profile);
          // Update ALL completed sections from API (overwrite to sync with actual points)
          if (data.completedSections) {
            setCompletedSections({
              basic: !!data.completedSections.basic,
              personal: !!data.completedSections.personal,
              skills: !!data.completedSections.skills,
              music: !!data.completedSections.music,
              jkvHistorie: !!data.completedSections.jkvHistorie,
              borrelStats: !!data.completedSections.borrelStats,
              quiz: !!data.completedSections.quiz,
            });
          }
        }
        setProfileSynced(true);
      }
    } catch (error) {
      console.error('Error syncing profile from database:', error);
    }
  }, [formData.email, profileSynced, setFormData, setCompletedSections]);

  // Fetch profile from DB to sync any changes
  useEffect(() => {
    if (isComplete && formData.email && !profileSynced) {
      syncProfileFromDb();
    }
  }, [isComplete, formData.email, profileSynced, syncProfileFromDb]);

  // Fetch leaderboard data
  useEffect(() => {
    if (isComplete && formData.email) {
      fetch(`/api/leaderboard?email=${encodeURIComponent(formData.email)}`)
        .then(res => res.json())
        .then(data => {
          setLeaderboardData(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [isComplete, formData.email]);

  // Refresh leaderboard data (must be before any conditional returns)
  const refreshLeaderboard = useCallback(async () => {
    if (!formData.email) return;

    // Also sync profile to ensure points are up to date
    await fetch(`/api/profile?email=${encodeURIComponent(formData.email)}`);

    // Then fetch fresh leaderboard
    const res = await fetch(`/api/leaderboard?email=${encodeURIComponent(formData.email)}`);
    const data = await res.json();
    setLeaderboardData(data);
  }, [formData.email]);

  // Show loading while waiting for client-side mount and BOTH stores to hydrate
  if (!isMounted || !registrationHydrated || !authHydrated) {
    return (
      <div className="min-h-screen bg-deep-green flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  // After hydration, check if we should show the dashboard
  // If not authenticated or not complete, the useEffect will redirect
  if (!isAuthenticated || !isComplete) {
    return (
      <div className="min-h-screen bg-deep-green flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  const userPoints = leaderboardData?.currentUser?.points ?? 0;
  const userRank = leaderboardData?.currentUser?.rank ?? '-';
  const profileCompletion = getProfileCompletion();

  return (
    <DashboardLayout>
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 border border-gold/10 rounded-full" />
        <div className="absolute bottom-20 right-20 w-48 h-48 border border-gold/10 rounded-full" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-6">
            {/* Home Tab Content */}
            <HomeTab
              formData={formData}
              aiAssignment={aiAssignment}
              userPoints={userPoints}
              userRank={userRank}
              isLoading={isLoading}
              predictionsSubmitted={predictionsSubmitted}
              profileCompletion={profileCompletion}
            />

            {/* Predictions */}
            <FeatureToggle feature="show_predictions">
              <PredictionsTab predictionsSubmitted={predictionsSubmitted} />
            </FeatureToggle>
          </div>

          {/* Sidebar - 1 column on large screens */}
          <div className="space-y-6">
            {/* Mini Leaderboard CTA */}
            <FeatureToggle feature="show_leaderboard_preview">
              <MiniLeaderboard
                leaderboard={leaderboardData?.leaderboard ?? []}
                currentUserName={formData.name}
                currentUserRank={userRank}
                currentUserPoints={userPoints}
                isLoading={isLoading}
                onRefresh={refreshLeaderboard}
              />
            </FeatureToggle>

            {/* Full Leaderboard */}
            <LeaderboardTab
              leaderboard={leaderboardData?.leaderboard ?? []}
              totalParticipants={leaderboardData?.totalParticipants ?? 0}
              currentUserName={formData.name}
              currentUserRank={userRank}
              currentUserPoints={userPoints}
              isLoading={isLoading}
              onRefresh={refreshLeaderboard}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-cream/30 text-xs uppercase tracking-widest">
            Bovenkamer Winterproef • Alumni Junior Kamer Venray
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
