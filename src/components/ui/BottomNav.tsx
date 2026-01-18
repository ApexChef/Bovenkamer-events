'use client';

import { Home, Target, Trophy, User } from 'lucide-react';

export type TabType = 'home' | 'predictions' | 'leaderboard' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

const tabs = [
  { id: 'home' as TabType, label: 'Home', icon: Home },
  { id: 'predictions' as TabType, label: 'Voorspellingen', icon: Target },
  { id: 'leaderboard' as TabType, label: 'Ranking', icon: Trophy },
  { id: 'profile' as TabType, label: 'Profiel', icon: User },
];

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden">
      {/* Background blur */}
      <div className="absolute inset-0 bg-dark-wood/95 backdrop-blur-lg border-t border-gold/20" />

      {/* Safe area padding for iOS */}
      <div className="relative flex items-center justify-around px-2 pt-2 pb-safe">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-gold'
                  : 'text-cream/50 hover:text-cream/70'
              }`}
            >
              <div className={`relative ${isActive ? 'scale-110' : ''} transition-transform duration-200`}>
                <Icon className="w-6 h-6" />
                {isActive && (
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-gold rounded-full" />
                )}
              </div>
              <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
