/**
 * Mobile Menu Component (React Island)
 * Mobile navigation overlay with slide-in animation
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import type { NavigationItem } from '../../types';

interface MobileMenuProps {
  items: NavigationItem[];
}

export default function MobileMenu({ items }: MobileMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Listen for toggle event from header
  useEffect(() => {
    const handleToggle = () => setIsOpen(prev => !prev);
    window.addEventListener('toggle-mobile-menu', handleToggle);
    return () => window.removeEventListener('toggle-mobile-menu', handleToggle);
  }, []);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = () => setIsOpen(false);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 lg:hidden"
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white shadow-2xl z-50 lg:hidden overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label="Mobiel menu"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <span className="text-xl font-bold text-charcoal">Menu</span>
              <button
                onClick={handleClose}
                className="p-2 text-gray-600 hover:text-coral-600 transition-colors duration-200 rounded-lg hover:bg-gray-50"
                aria-label="Menu sluiten"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Navigation Items */}
            <nav className="p-6">
              <ul className="space-y-2">
                {items.map((item, index) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <a
                      href={item.href}
                      className="block px-4 py-3 text-lg font-medium text-gray-700 hover:text-coral-600 hover:bg-coral-50 rounded-lg transition-all duration-200"
                      onClick={handleClose}
                    >
                      {item.label}
                    </a>
                    {item.description && (
                      <p className="px-4 text-sm text-gray-500 mt-1">
                        {item.description}
                      </p>
                    )}
                  </motion.li>
                ))}
              </ul>

              {/* CTA Button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: items.length * 0.05 }}
                className="mt-8"
              >
                <a
                  href="/waitlist"
                  className="block w-full bg-coral-500 text-white text-center px-6 py-4 rounded-lg font-semibold text-lg hover:bg-coral-600 transition-all duration-200 shadow-button hover:shadow-button-hover"
                  onClick={handleClose}
                >
                  Start gratis
                </a>
                <p className="text-sm text-gray-500 text-center mt-3">
                  Geen creditcard nodig
                </p>
              </motion.div>
            </nav>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
