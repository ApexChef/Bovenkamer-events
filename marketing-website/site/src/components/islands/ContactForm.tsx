/**
 * Contact Form Component (React Island)
 * Contact form with validation, subject dropdown, and Netlify Forms submission
 */

import { useState, FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, User, MessageSquare, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import type { ContactFormData, FormState } from '../../types';

const subjectOptions = [
  { value: 'vraag', label: 'Vraag over Party Pilot' },
  { value: 'samenwerking', label: 'Samenwerking' },
  { value: 'bug', label: 'Bug melden' },
  { value: 'anders', label: 'Anders' },
];

export default function ContactForm() {
  const [formState, setFormState] = useState<FormState<ContactFormData>>({
    data: {
      name: '',
      email: '',
      subject: 'vraag',
      message: '',
    },
    loading: false,
    success: false,
    error: null,
  });

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formState.data.email)) {
      setFormState(prev => ({
        ...prev,
        error: 'Voer een geldig e-mailadres in',
      }));
      return;
    }

    if (formState.data.name.trim().length < 2) {
      setFormState(prev => ({
        ...prev,
        error: 'Voer je naam in',
      }));
      return;
    }

    if (formState.data.message.trim().length < 10) {
      setFormState(prev => ({
        ...prev,
        error: 'Je bericht moet minimaal 10 tekens bevatten',
      }));
      return;
    }

    setFormState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Submit to Netlify Forms (using hidden form trick)
      const formData = new FormData();
      formData.append('form-name', 'contact');
      formData.append('name', formState.data.name);
      formData.append('email', formState.data.email);
      formData.append('subject', formState.data.subject);
      formData.append('message', formState.data.message);

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

  const handleChange = (field: keyof ContactFormData, value: string) => {
    setFormState(prev => ({
      ...prev,
      data: { ...prev.data, [field]: value },
      error: null,
    }));
  };

  if (formState.success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 bg-success/10 border-2 border-success rounded-lg text-center"
      >
        <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
        <h3 class="text-2xl font-semibold text-charcoal mb-2">
          Bericht verstuurd!
        </h3>
        <p className="text-gray-600 mb-4 text-lg">
          Bedankt voor je bericht. We nemen binnen 24 uur contact met je op.
        </p>
        <button
          onClick={() => setFormState({
            data: { name: '', email: '', subject: 'vraag', message: '' },
            loading: false,
            success: false,
            error: null,
          })}
          className="text-coral-600 font-semibold hover:text-coral-700 transition-colors"
        >
          Nieuw bericht versturen
        </button>
      </motion.div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name Field */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          Naam <span className="text-coral-500">*</span>
        </label>
        <div className="relative">
          <input
            type="text"
            id="name"
            name="name"
            required
            value={formState.data.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Je volledige naam"
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all duration-200 text-base"
            disabled={formState.loading}
          />
          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
          E-mailadres <span className="text-coral-500">*</span>
        </label>
        <div className="relative">
          <input
            type="email"
            id="email"
            name="email"
            required
            value={formState.data.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="jouw@email.nl"
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all duration-200 text-base"
            disabled={formState.loading}
          />
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        </div>
      </div>

      {/* Subject Dropdown */}
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
          Onderwerp <span className="text-coral-500">*</span>
        </label>
        <select
          id="subject"
          name="subject"
          required
          value={formState.data.subject}
          onChange={(e) => handleChange('subject', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all duration-200 text-base bg-white"
          disabled={formState.loading}
        >
          {subjectOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Message Textarea */}
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
          Bericht <span className="text-coral-500">*</span>
        </label>
        <div className="relative">
          <textarea
            id="message"
            name="message"
            required
            rows={6}
            value={formState.data.message}
            onChange={(e) => handleChange('message', e.target.value)}
            placeholder="Vertel ons wat je wilt..."
            className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-500 focus:border-transparent transition-all duration-200 text-base resize-none"
            disabled={formState.loading}
          />
          <MessageSquare className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Minimaal 10 tekens
        </p>
      </div>

      {/* Error Message */}
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

      {/* Submit Button */}
      <button
        type="submit"
        disabled={formState.loading}
        className="w-full bg-coral-500 text-white px-6 py-4 rounded-lg font-semibold text-lg hover:bg-coral-600 transition-all duration-200 shadow-button hover:shadow-button-hover disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {formState.loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>Versturen...</span>
          </>
        ) : (
          <span>Verstuur bericht</span>
        )}
      </button>

      <p className="text-sm text-gray-500 text-center">
        We reageren binnen 24 uur op je bericht
      </p>
    </form>
  );
}
