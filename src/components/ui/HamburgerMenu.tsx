'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Gamepad2, HelpCircle, Shield, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface HamburgerMenuProps {
  onLogout?: () => void;
}

const menuItems = [
  { href: '/game', label: 'Burger Stack', icon: Gamepad2, description: 'Speel het spel' },
  { href: '/quiz', label: 'Live Quiz', icon: HelpCircle, description: 'Beschikbaar op 31 jan', disabled: true },
  { href: '/admin', label: 'Admin', icon: Shield, description: 'Beheer overzicht' },
];

export function HamburgerMenu({ onLogout }: HamburgerMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="p-2.5 bg-gold/20 border border-gold/30 rounded-lg text-gold hover:bg-gold/30 hover:border-gold/50 transition-colors"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay & Menu */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-72 border-l border-gold/20 z-50 flex flex-col shadow-2xl" style={{ backgroundColor: '#2C1810' }}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gold/20">
                <span className="font-display text-gold text-lg">Menu</span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-cream/70 hover:text-gold transition-colors"
                  aria-label="Sluit menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Menu Items */}
              <div className="flex-1 py-4" style={{ backgroundColor: '#2C1810' }}>
                {menuItems.map((item) => {
                  const Icon = item.icon;

                  if (item.disabled) {
                    return (
                      <div
                        key={item.href}
                        className="flex items-center gap-3 px-4 py-3 text-cream/30 cursor-not-allowed"
                      >
                        <Icon className="w-5 h-5" />
                        <div>
                          <p className="font-medium">{item.label}</p>
                          <p className="text-xs">{item.description}</p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-cream hover:bg-gold/10 hover:text-gold transition-colors"
                    >
                      <Icon className="w-5 h-5" />
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="text-xs text-cream/50">{item.description}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Logout */}
              {onLogout && (
                <div className="p-4 border-t border-gold/20">
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      onLogout();
                    }}
                    className="flex items-center gap-3 w-full px-4 py-3 text-warm-red hover:bg-warm-red/10 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">Uitloggen</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
