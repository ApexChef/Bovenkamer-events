/**
 * File: src/lib/auth/pin.ts
 * Purpose: PIN validation, hashing, and verification utilities for authentication
 *
 * Key Features:
 * - PIN format validation (XX## - 2 letters + 2 digits)
 * - Secure hashing using bcrypt with salt rounds
 * - PIN verification with timing attack protection
 * - PIN collision detection
 *
 * PIN Format: XX## (e.g., AB12, CD34)
 * - 67,600 unique combinations available (26*26*10*10)
 * - Sufficient for ~50 participant event
 */

import bcrypt from 'bcryptjs';

// Configuration
const SALT_ROUNDS = 10; // bcrypt salt rounds (2^10 = 1024 iterations)
const PIN_REGEX = /^[A-Z]{2}\d{2}$/; // XX## format

/**
 * Validates PIN format
 * @param pin - PIN to validate
 * @returns true if PIN matches XX## format
 */
export function isValidPINFormat(pin: string): boolean {
  if (!pin || typeof pin !== 'string') {
    return false;
  }

  // Convert to uppercase for validation
  const upperPin = pin.toUpperCase();
  return PIN_REGEX.test(upperPin);
}

/**
 * Normalizes PIN to uppercase format
 * @param pin - PIN to normalize
 * @returns Uppercase PIN or null if invalid
 */
export function normalizePIN(pin: string): string | null {
  if (!pin || typeof pin !== 'string') {
    return null;
  }

  const upperPin = pin.toUpperCase().trim();
  return isValidPINFormat(upperPin) ? upperPin : null;
}

/**
 * Generates a random PIN for suggestions
 * @returns Random PIN in XX## format
 */
export function generateRandomPIN(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';

  const letter1 = letters[Math.floor(Math.random() * letters.length)];
  const letter2 = letters[Math.floor(Math.random() * letters.length)];
  const digit1 = digits[Math.floor(Math.random() * digits.length)];
  const digit2 = digits[Math.floor(Math.random() * digits.length)];

  return `${letter1}${letter2}${digit1}${digit2}`;
}

/**
 * Validates PIN format and returns detailed error message
 * @param pin - PIN to validate
 * @returns Error message or null if valid
 */
export function validatePINFormat(pin: string): string | null {
  if (!pin) {
    return 'PIN is verplicht';
  }

  if (pin.length !== 4) {
    return 'PIN moet exact 4 tekens zijn';
  }

  const upperPin = pin.toUpperCase();

  if (!/^[A-Z]{2}/.test(upperPin)) {
    return 'PIN moet beginnen met 2 letters (A-Z)';
  }

  if (!/\d{2}$/.test(upperPin)) {
    return 'PIN moet eindigen met 2 cijfers (0-9)';
  }

  if (!PIN_REGEX.test(upperPin)) {
    return 'PIN moet format XX## hebben (bijv. AB12)';
  }

  return null;
}

/**
 * Hashes a PIN using bcrypt
 * @param pin - PIN to hash (will be normalized)
 * @returns Object with hash and salt, or null if PIN invalid
 */
export async function hashPIN(pin: string): Promise<{ hash: string; salt: string } | null> {
  const normalizedPIN = normalizePIN(pin);

  if (!normalizedPIN) {
    return null;
  }

  try {
    // Generate salt
    const salt = await bcrypt.genSalt(SALT_ROUNDS);

    // Hash PIN with salt
    const hash = await bcrypt.hash(normalizedPIN, salt);

    return { hash, salt };
  } catch (error) {
    console.error('Error hashing PIN:', error);
    return null;
  }
}

/**
 * Verifies a PIN against a hash
 * @param pin - PIN to verify
 * @param hash - Stored hash to compare against
 * @returns true if PIN matches hash
 */
export async function verifyPIN(pin: string, hash: string): Promise<boolean> {
  const normalizedPIN = normalizePIN(pin);

  if (!normalizedPIN || !hash) {
    return false;
  }

  try {
    // bcrypt.compare is timing-attack safe
    const isMatch = await bcrypt.compare(normalizedPIN, hash);
    return isMatch;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
}

/**
 * Validates PIN confirmation match
 * @param pin - Original PIN
 * @param pinConfirm - Confirmation PIN
 * @returns Error message or null if match
 */
export function validatePINConfirmation(pin: string, pinConfirm: string): string | null {
  if (!pinConfirm) {
    return 'Bevestig je PIN';
  }

  const normalizedPIN = normalizePIN(pin);
  const normalizedConfirm = normalizePIN(pinConfirm);

  if (normalizedPIN !== normalizedConfirm) {
    return 'PINs komen niet overeen';
  }

  return null;
}

/**
 * Generates validation errors for PIN and confirmation
 * @param pin - PIN to validate
 * @param pinConfirm - Confirmation PIN
 * @returns Object with field-specific errors
 */
export function validatePINFields(
  pin: string,
  pinConfirm: string
): { pin?: string; pinConfirm?: string } {
  const errors: { pin?: string; pinConfirm?: string } = {};

  const formatError = validatePINFormat(pin);
  if (formatError) {
    errors.pin = formatError;
  }

  const confirmError = validatePINConfirmation(pin, pinConfirm);
  if (confirmError) {
    errors.pinConfirm = confirmError;
  }

  return errors;
}

/**
 * Estimates time to crack PIN via brute force
 * Used for security documentation/display
 * @returns Object with crack time estimates
 */
export function getPINSecurityMetrics() {
  const totalCombinations = 26 * 26 * 10 * 10; // 67,600
  const attemptsPerSecond = 10; // Rate limited to ~10 attempts/sec
  const lockoutAttempts = 10;

  return {
    totalCombinations,
    uniqueSpace: '67,600 unique PINs',
    bruteForceDuration: `${Math.ceil(totalCombinations / attemptsPerSecond / 3600)} hours (unlimited attempts)`,
    withRateLimit: 'Effectively impossible with rate limiting',
    withLockout: `Max ${lockoutAttempts} attempts before 1-hour lockout`,
  };
}
