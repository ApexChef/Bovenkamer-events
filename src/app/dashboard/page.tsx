'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useRegistrationStore, usePredictionsStore, useAuthStore } from '@/lib/store';
import { BottomNav, HamburgerMenu, DesktopHeader } from '@/components/ui';
import type { TabType } from '@/components/ui';
import { HomeTab, PredictionsTab, LeaderboardTab, ProfileTab, MiniLeaderboard } from '@/components/dashboard';
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
  const { formData, aiAssignment, isComplete, _hasHydrated: registrationHydrated, getProfileCompletion } = useRegistrationStore();
  const { isSubmitted: predictionsSubmitted } = usePredictionsStore();
  const { logout, isAuthenticated, currentUser, _hasHydrated: authHydrated } = useAuthStore();
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isMounted, setIsMounted] = useState(false);

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

  // Handle logout
  const handleLogout = () => {
    logout();
    router.push('/');
  };

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

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeTab
            formData={formData}
            aiAssignment={aiAssignment}
            userPoints={userPoints}
            userRank={userRank}
            isLoading={isLoading}
            predictionsSubmitted={predictionsSubmitted}
            profileCompletion={profileCompletion}
          />
        );
      case 'predictions':
        return <PredictionsTab predictionsSubmitted={predictionsSubmitted} />;
      case 'leaderboard':
        return (
          <LeaderboardTab
            leaderboard={leaderboardData?.leaderboard ?? []}
            totalParticipants={leaderboardData?.totalParticipants ?? 0}
            currentUserName={formData.name}
            currentUserRank={userRank}
            currentUserPoints={userPoints}
            isLoading={isLoading}
          />
        );
      case 'profile':
        return <ProfileTab formData={formData} />;
      default:
        return null;
    }
  };

  return (
    <main className="min-h-screen pb-20 md:pb-8">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-32 h-32 border border-gold/10 rounded-full" />
        <div className="absolute bottom-20 right-20 w-48 h-48 border border-gold/10 rounded-full" />
      </div>

      {/* Mobile Header */}
      <header className="sticky top-0 z-40 md:hidden">
        <div className="bg-dark-wood/95 backdrop-blur-lg border-b border-gold/20">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="font-display text-lg text-gold">Bovenkamer</h1>
              <p className="text-cream/50 text-xs">Welkom, {formData.name}</p>
            </div>
            <HamburgerMenu onLogout={handleLogout} />
          </div>
        </div>
      </header>

      {/* Desktop Header Navigation */}
      <DesktopHeader userName={formData.name} onLogout={handleLogout} />

      {/* Content */}
      <div className="relative z-10 px-4 py-4 md:py-0">
        <div className="max-w-4xl mx-auto">
          {/* Mobile: Tab Content */}
          <div className="md:hidden">
            {renderTabContent()}
          </div>

          {/* Desktop: Full Dashboard (original layout) */}
          <div className="hidden md:block">
            <DesktopDashboard
              formData={formData}
              aiAssignment={aiAssignment}
              userPoints={userPoints}
              userRank={userRank}
              isLoading={isLoading}
              predictionsSubmitted={predictionsSubmitted}
              leaderboardData={leaderboardData}
              profileCompletion={profileCompletion}
            />
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Desktop Footer */}
      <div className="hidden md:block mt-8 text-center">
        <p className="text-cream/30 text-xs uppercase tracking-widest">
          Bovenkamer Winterproef • Alumni Junior Kamer Venray
        </p>
      </div>
    </main>
  );
}

// Desktop version with full layout
function DesktopDashboard({
  formData,
  aiAssignment,
  userPoints,
  userRank,
  isLoading,
  predictionsSubmitted,
  leaderboardData,
  profileCompletion,
}: {
  formData: any;
  aiAssignment: any;
  userPoints: number;
  userRank: number | string;
  isLoading: boolean;
  predictionsSubmitted: boolean;
  leaderboardData: LeaderboardData | null;
  profileCompletion: { percentage: number; points: number; completedSections: string[] };
}) {
  return (
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
        <PredictionsTab predictionsSubmitted={predictionsSubmitted} />

        {/* Profile */}
        <ProfileTab formData={formData} />
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
          />
        </FeatureToggle>

        {/* Full Leaderboard (collapsible on desktop) */}
        <LeaderboardTab
          leaderboard={leaderboardData?.leaderboard ?? []}
          totalParticipants={leaderboardData?.totalParticipants ?? 0}
          currentUserName={formData.name}
          currentUserRank={userRank}
          currentUserPoints={userPoints}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
