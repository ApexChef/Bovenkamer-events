/**
 * File: src/lib/auth/email-service.ts
 * Purpose: Email sending service for authentication flows
 *
 * Key Features:
 * - Send verification emails
 * - Send PIN reset emails
 * - Send approval/rejection notifications
 * - Development mode (console logging)
 * - Production mode (Resend integration - when configured)
 *
 * Dependencies:
 * - Requires RESEND_API_KEY environment variable for production
 * - Falls back to console logging in development
 */

import {
  registrationVerificationEmail,
  registrationVerificationPlainText,
  pinResetEmail,
  registrationApprovedEmail,
  registrationRejectedEmail,
  resendVerificationEmail,
} from './email-templates';

// Email service configuration
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@bovenkamer-winterproef.nl';
const FROM_NAME = 'Bovenkamer Winterproef';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * Email send result
 */
export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Sends an email using Resend API (production) or logs to console (development)
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param html - HTML content
 * @param text - Plain text fallback
 * @returns Email send result
 */
async function sendEmail(
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<EmailResult> {
  // Development mode - log to console (only if no API key)
  if (!RESEND_API_KEY) {
    console.log('📧 Email (Development Mode - No RESEND_API_KEY)');
    console.log('─────────────────────────────');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`From: ${FROM_NAME} <${FROM_EMAIL}>`);
    console.log('─────────────────────────────');
    console.log(text || 'No plain text version');
    console.log('─────────────────────────────\n');

    return {
      success: true,
      messageId: `dev-${Date.now()}`,
    };
  }

  // Production mode - use Resend API
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: [to],
        subject,
        html,
        text: text || undefined,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Email send failed:', error);
      return {
        success: false,
        error: `Failed to send email: ${response.statusText}`,
      };
    }

    const data = await response.json();

    return {
      success: true,
      messageId: data.id,
    };
  } catch (error) {
    console.error('Email send error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Sends registration verification email
 * @param to - Recipient email
 * @param name - User's name
 * @param verificationToken - Verification token
 * @returns Email send result
 */
export async function sendVerificationEmail(
  to: string,
  name: string,
  verificationToken: string
): Promise<EmailResult> {
  const subject = 'Verifieer je email - Bovenkamer Winterproef';
  const html = registrationVerificationEmail(name, verificationToken);
  const text = registrationVerificationPlainText(name, verificationToken);

  return sendEmail(to, subject, html, text);
}

/**
 * Sends PIN reset email
 * @param to - Recipient email
 * @param name - User's name
 * @param resetToken - PIN reset token
 * @returns Email send result
 */
export async function sendPINResetEmail(
  to: string,
  name: string,
  resetToken: string
): Promise<EmailResult> {
  const subject = 'Reset je PIN - Bovenkamer Winterproef';
  const html = pinResetEmail(name, resetToken);
  const text = `
Bovenkamer Winterproef - PIN Reset

Hoi ${name},

We hebben een aanvraag ontvangen om je PIN te resetten.

Gebruik deze link om een nieuwe PIN in te stellen:
${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/reset-pin?token=${resetToken}

Als je deze aanvraag niet hebt gedaan, negeer deze email dan.

Let op: Deze resetlink is 1 uur geldig.

Bovenkamer Winterproef
  `.trim();

  return sendEmail(to, subject, html, text);
}

/**
 * Sends registration approved email
 * @param to - Recipient email
 * @param name - User's name
 * @returns Email send result
 */
export async function sendApprovalEmail(to: string, name: string): Promise<EmailResult> {
  const subject = '🎉 Je bent goedgekeurd! - Bovenkamer Winterproef';
  const html = registrationApprovedEmail(name);
  const text = `
Bovenkamer Winterproef - Je bent goedgekeurd!

Gefeliciteerd ${name}!

Je registratie is goedgekeurd! Je kunt nu inloggen en alle functies gebruiken:

- Voorspellingen doen
- Meedoen aan de live quiz
- Boy Boom beoordelen
- Punten verzamelen

Log in op: ${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/login

Gebruik je email adres en de 4-cijferige PIN die je hebt aangemaakt.

We kijken ernaar uit om je te zien bij de Winterproef!

Bovenkamer Winterproef Nieuwjaars-BBQ 2026
  `.trim();

  return sendEmail(to, subject, html, text);
}

/**
 * Sends registration rejected email
 * @param to - Recipient email
 * @param name - User's name
 * @param reason - Rejection reason
 * @returns Email send result
 */
export async function sendRejectionEmail(
  to: string,
  name: string,
  reason: string
): Promise<EmailResult> {
  const subject = 'Registratie update - Bovenkamer Winterproef';
  const html = registrationRejectedEmail(name, reason);
  const text = `
Bovenkamer Winterproef - Registratie Update

Hoi ${name},

We hebben je registratie voor de Bovenkamer Winterproef beoordeeld.

Helaas kunnen we je registratie op dit moment niet goedkeuren.

Reden: ${reason}

Heb je vragen over deze beslissing? Neem dan contact op met de organisatie.

Hopelijk tot een volgende keer!

Bovenkamer Winterproef
  `.trim();

  return sendEmail(to, subject, html, text);
}

/**
 * Resends verification email
 * @param to - Recipient email
 * @param name - User's name
 * @param verificationToken - Verification token
 * @returns Email send result
 */
export async function resendVerification(
  to: string,
  name: string,
  verificationToken: string
): Promise<EmailResult> {
  const subject = 'Email Verificatie - Bovenkamer Winterproef';
  const html = resendVerificationEmail(name, verificationToken);
  const text = `
Bovenkamer Winterproef - Email Verificatie

Hoi ${name},

Hier is je nieuwe verificatielink:
${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${verificationToken}

Deze link is 48 uur geldig.

Bovenkamer Winterproef
  `.trim();

  return sendEmail(to, subject, html, text);
}

/**
 * Validates email format
 * @param email - Email to validate
 * @returns true if valid email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim().toLowerCase());
}

/**
 * Normalizes email to lowercase
 * @param email - Email to normalize
 * @returns Lowercase email or null if invalid
 */
export function normalizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }

  const trimmed = email.trim().toLowerCase();
  return isValidEmail(trimmed) ? trimmed : null;
}
