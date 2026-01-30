/**
 * Waitlist Form Component (React Island)
 * Email capture form with validation and success state
 */

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { WaitlistFormData, FormState } from '../../types';

interface WaitlistFormProps {
  referralCode?: string;
  compact?: boolean;
}

export default function WaitlistForm({ referralCode, compact = false }: WaitlistFormProps) {
  const [formState, setFormState] = useState<FormState<WaitlistFormData>>({
    data: {
      email: '',
      name: '',
      referralCode: referralCode || '',
    },
    loading: false,
    success: false,
    error: null,
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.data.email)) {
      setFormState(prev => ({
        ...prev,
        error: 'Voer een geldig e-mailadres in',
      }));
      return;
    }

    setFormState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Submit to Netlify Forms (using hidden form trick)
      const formData = new FormData();
      formData.append('form-name', 'waitlist');
      formData.append('email', formState.data.email);
      if (formState.data.name) formData.append('name', formState.data.name);
      if (formState.data.referralCode) formData.append('referralCode', formState.data.referralCode);

      const response = await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData as any).toString(),
      });

      if (response.ok) {
        setFormState(prev => ({
          ...prev,
          loading: false,
          success: true,
        }));
      } else {
        throw new Error('Submission failed');
      }
    } catch (error) {
      setFormState(prev => ({
        ...prev,
        loading: false,
        error: 'Er ging iets mis. Probeer het opnieuw.',
      }));
    }
  };

  const handleEmailChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, email: value },
      error: null,
    }));
  };

  const handleNameChange = (value: string) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, name: value },
    }));
  };

  if (formState.success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`${compact ? 'p-6' : 'p-8'} bg-success/10 border-2 border-success rounded-lg text-center`}
      >
        <CheckCircle className="w-12 h-12 text-success mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-charcoal mb-2">
          Je bent toegevoegd aan de waitlist!
        </h3>
        <p className="text-gray-600 mb-4">
          We houden je op de hoogte. Check je inbox voor een bevestiging.
        </p>
        <p className="text-sm text-gray-500">
          Vergeet niet je spam folder te checken 😉
        </p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!compact && (
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            Naam (optioneel)
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formState.data.name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Je voornaam"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all duration-200 text-base"
            disabled={formState.loading}
          />
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          E-mailadres {compact && <span className="text-gray-500">(verplicht)</span>}
        </label>
        <div className="relative">
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formState.data.email}
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="jouw@email.nl"
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all duration-200 text-base"
            disabled={formState.loading}
          />
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      <AnimatePresence>
        {formState.error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 p-3 bg-error/10 border border-error/20 rounded-lg text-error text-sm"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{formState.error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="submit"
        disabled={formState.loading || !formState.data.email}
        className="w-full bg-coral-500 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-coral-600 transition-all duration-200 shadow-button hover:shadow-button-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {formState.loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Even geduld...</span>
          </>
        ) : (
          <span>Schrijf me in!</span>
        )}
      </button>

      <p className="text-sm text-gray-500 text-center">
        We respecteren je privacy. Geen spam, alleen updates over Party Pilot.
      </p>
    </form>
  );
}
