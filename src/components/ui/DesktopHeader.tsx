'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home,
  BarChart3,
  Trophy,
  User,
  LogOut,
  ChevronDown,
  Flame,
} from 'lucide-react';

interface DesktopHeaderProps {
  userName: string;
  onLogout: () => void;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Home', icon: <Home className="w-4 h-4" /> },
  { href: '/predictions', label: 'Voorspellingen', icon: <BarChart3 className="w-4 h-4" /> },
  { href: '/dashboard?tab=leaderboard', label: 'Ranking', icon: <Trophy className="w-4 h-4" /> },
  { href: '/profile', label: 'Profiel', icon: <User className="w-4 h-4" /> },
];

export function DesktopHeader({ userName, onLogout }: DesktopHeaderProps) {
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (href: string) => {
    if (href.includes('?')) {
      return pathname === href.split('?')[0];
    }
    return pathname === href;
  };

  return (
    <header className="hidden md:block sticky top-0 z-50 bg-dark-wood/95 backdrop-blur-lg border-b border-gold/20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-gold to-yellow-600 rounded-lg flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 text-dark-wood" />
            </div>
            <div className="flex flex-col">
              <span className="font-display text-lg text-gold leading-tight">Bovenkamer</span>
              <span className="text-[10px] text-cream/40 uppercase tracking-wider -mt-0.5">Winterproef</span>
            </div>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    relative flex items-center gap-2 px-4 py-2 rounded-lg
                    text-sm font-medium transition-all duration-200
                    ${active
                      ? 'text-gold'
                      : 'text-cream/70 hover:text-cream hover:bg-cream/5'
                    }
                  `}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="activeNavIndicator"
                      className="absolute inset-0 bg-gold/10 rounded-lg border border-gold/30"
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-cream/70 hover:text-cream hover:bg-cream/5 transition-all"
            >
              <div className="w-8 h-8 bg-gold/20 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gold" />
              </div>
              <span className="text-sm font-medium max-w-[120px] truncate">{userName}</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowUserMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute right-0 mt-2 w-48 bg-dark-wood border border-gold/20 rounded-lg shadow-xl z-20 overflow-hidden"
                >
                  <Link
                    href="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-cream/70 hover:text-cream hover:bg-gold/10 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Mijn Profiel
                  </Link>
                  <hr className="border-gold/10" />
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      onLogout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm text-warm-red/80 hover:text-warm-red hover:bg-warm-red/10 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Uitloggen
                  </button>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
