'use client';

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
}

const EMOJI_GROUPS = {
  food: {
    label: 'Eten',
    emojis: ['🍖', '🥩', '🍗', '🐟', '🥬', '🧀', '🍞', '🥗', '🍝', '🍕'],
  },
  animals: {
    label: 'Dieren',
    emojis: ['🐷', '🐄', '🐔', '🐑', '🦌', '🐟', '🦐', '🦞', '🦀', '🐙'],
  },
  drinks: {
    label: 'Drankjes',
    emojis: ['🍷', '🍺', '🥂', '🍾', '☕', '🧃', '🥤', '🧊', '🍹', '🍸'],
  },
  symbols: {
    label: 'Symbolen',
    emojis: ['✅', '❌', '🔥', '❄️', '☀️', '🌧️', '⏰', '🎵', '⭐', '💯'],
  },
  people: {
    label: 'Mensen',
    emojis: ['👤', '👥', '🧑', '👨', '👩', '🙋', '🤷', '💪', '👏', '🙌'],
  },
  other: {
    label: 'Overig',
    emojis: ['📍', '🏆', '🎯', '📊', '💡', '🎉', '🎈', '🔔', '📅', '🌟'],
  },
} as const;

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-12 h-12 flex items-center justify-center',
          'bg-dark-wood/50 border border-gold/30 rounded-md',
          'text-2xl hover:border-gold transition-colors',
          'focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/50'
        )}
        title="Selecteer emoji"
      >
        {value || '😀'}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-2 p-4 bg-dark-wood border border-gold/30 rounded-lg shadow-xl w-80 max-h-96 overflow-y-auto">
          {Object.entries(EMOJI_GROUPS).map(([key, group]) => (
            <div key={key} className="mb-4 last:mb-0">
              <p className="text-xs font-semibold text-gold/80 mb-2 uppercase tracking-wider">
                {group.label}
              </p>
              <div className="grid grid-cols-8 gap-1">
                {group.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      onChange(emoji);
                      setIsOpen(false);
                    }}
                    className={cn(
                      'text-2xl p-2 rounded transition-all',
                      'hover:scale-110 hover:bg-gold/20',
                      value === emoji && 'bg-gold/30 scale-110'
                    )}
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Clear button */}
          <div className="border-t border-gold/10 pt-3 mt-3">
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className="w-full py-2 text-sm text-cream/60 hover:text-gold transition-colors"
            >
              Geen emoji
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
