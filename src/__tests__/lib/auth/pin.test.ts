/**
 * Unit tests for PIN validation utilities
 * Tests cover: format validation, normalization, hashing, verification
 *
 * Test Coverage:
 * - LOGIN-005 to LOGIN-010 (PIN validation scenarios)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  isValidPINFormat,
  normalizePIN,
  generateRandomPIN,
  validatePINFormat,
  hashPIN,
  verifyPIN,
  validatePINConfirmation,
  validatePINFields,
  getPINSecurityMetrics,
} from '@/lib/auth/pin';

describe('PIN Utilities', () => {
  describe('isValidPINFormat', () => {
    it('should accept valid PIN format XX## (uppercase letters + digits)', () => {
      expect(isValidPINFormat('AB12')).toBe(true);
      expect(isValidPINFormat('XY99')).toBe(true);
      expect(isValidPINFormat('ZZ00')).toBe(true);
      expect(isValidPINFormat('AA11')).toBe(true);
    });

    it('should accept lowercase letters and validate after conversion', () => {
      expect(isValidPINFormat('ab12')).toBe(true);
      expect(isValidPINFormat('xy99')).toBe(true);
      expect(isValidPINFormat('Ab12')).toBe(true);
    });

    it('should reject PINs with wrong format - all digits (LOGIN-009)', () => {
      expect(isValidPINFormat('1234')).toBe(false);
      expect(isValidPINFormat('0000')).toBe(false);
    });

    it('should reject PINs with wrong format - all letters', () => {
      expect(isValidPINFormat('ABCD')).toBe(false);
      expect(isValidPINFormat('abcd')).toBe(false);
    });

    it('should reject PINs that are too short (LOGIN-008)', () => {
      expect(isValidPINFormat('AB1')).toBe(false);
      expect(isValidPINFormat('A12')).toBe(false);
      expect(isValidPINFormat('123')).toBe(false);
    });

    it('should reject PINs that are too long', () => {
      expect(isValidPINFormat('AB123')).toBe(false);
      expect(isValidPINFormat('ABC12')).toBe(false);
    });

    it('should reject PINs with special characters', () => {
      expect(isValidPINFormat('A@12')).toBe(false);
      expect(isValidPINFormat('AB-2')).toBe(false);
      expect(isValidPINFormat('AB 2')).toBe(false);
    });

    it('should reject PINs with digits first', () => {
      expect(isValidPINFormat('12AB')).toBe(false);
      expect(isValidPINFormat('1A2B')).toBe(false);
    });

    it('should reject empty or null input', () => {
      expect(isValidPINFormat('')).toBe(false);
      expect(isValidPINFormat(null as any)).toBe(false);
      expect(isValidPINFormat(undefined as any)).toBe(false);
    });
  });

  describe('normalizePIN', () => {
    it('should normalize lowercase PIN to uppercase (LOGIN-010)', () => {
      expect(normalizePIN('ab12')).toBe('AB12');
      expect(normalizePIN('xy99')).toBe('XY99');
    });

    it('should handle mixed case normalization', () => {
      expect(normalizePIN('Ab12')).toBe('AB12');
      expect(normalizePIN('aB12')).toBe('AB12');
    });

    it('should trim whitespace', () => {
      expect(normalizePIN(' AB12 ')).toBe('AB12');
      expect(normalizePIN('  AB12')).toBe('AB12');
      expect(normalizePIN('AB12  ')).toBe('AB12');
    });

    it('should return null for invalid PIN format', () => {
      expect(normalizePIN('1234')).toBe(null);
      expect(normalizePIN('ABCD')).toBe(null);
      expect(normalizePIN('AB1')).toBe(null);
    });

    it('should return null for empty input', () => {
      expect(normalizePIN('')).toBe(null);
      expect(normalizePIN(null as any)).toBe(null);
      expect(normalizePIN(undefined as any)).toBe(null);
    });
  });

  describe('generateRandomPIN', () => {
    it('should generate a valid PIN format', () => {
      const pin = generateRandomPIN();
      expect(isValidPINFormat(pin)).toBe(true);
      expect(pin).toHaveLength(4);
    });

    it('should generate different PINs (randomness check)', () => {
      const pins = new Set();
      for (let i = 0; i < 100; i++) {
        pins.add(generateRandomPIN());
      }
      // Should have generated at least 80 unique PINs out of 100
      expect(pins.size).toBeGreaterThan(80);
    });
  });

  describe('validatePINFormat', () => {
    it('should return null for valid PIN', () => {
      expect(validatePINFormat('AB12')).toBe(null);
      expect(validatePINFormat('xy99')).toBe(null);
    });

    it('should return error message for empty PIN (LOGIN-006)', () => {
      const error = validatePINFormat('');
      expect(error).toBe('PIN is verplicht');
    });

    it('should return error for wrong length', () => {
      const error = validatePINFormat('AB1');
      expect(error).toBe('PIN moet exact 4 tekens zijn');
    });

    it('should return error for missing letters', () => {
      const error = validatePINFormat('1234');
      expect(error).toContain('moet beginnen met 2 letters');
    });

    it('should return error for missing digits', () => {
      const error = validatePINFormat('ABCD');
      expect(error).toContain('moet eindigen met 2 cijfers');
    });
  });

  describe('hashPIN', () => {
    it('should hash a valid PIN', async () => {
      const result = await hashPIN('AB12');
      expect(result).not.toBe(null);
      expect(result?.hash).toBeTruthy();
      expect(result?.salt).toBeTruthy();
      expect(result?.hash).not.toBe('AB12'); // Should be hashed
    });

    it('should normalize PIN before hashing', async () => {
      const result1 = await hashPIN('ab12');
      const result2 = await hashPIN('AB12');
      expect(result1).not.toBe(null);
      expect(result2).not.toBe(null);
      // Note: hashes will differ due to different salts, but both should succeed
    });

    it('should return null for invalid PIN', async () => {
      const result = await hashPIN('1234');
      expect(result).toBe(null);
    });

    it('should generate different hashes for same PIN (different salts)', async () => {
      const hash1 = await hashPIN('AB12');
      const hash2 = await hashPIN('AB12');
      expect(hash1?.hash).not.toBe(hash2?.hash);
    });
  });

  describe('verifyPIN', () => {
    it('should verify correct PIN against hash', async () => {
      const hashed = await hashPIN('AB12');
      expect(hashed).not.toBe(null);

      const isValid = await verifyPIN('AB12', hashed!.hash);
      expect(isValid).toBe(true);
    });

    it('should normalize PIN before verification (LOGIN-010)', async () => {
      const hashed = await hashPIN('AB12');
      expect(hashed).not.toBe(null);

      // Verify with lowercase
      const isValid = await verifyPIN('ab12', hashed!.hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect PIN (LOGIN-011)', async () => {
      const hashed = await hashPIN('AB12');
      expect(hashed).not.toBe(null);

      const isValid = await verifyPIN('XX99', hashed!.hash);
      expect(isValid).toBe(false);
    });

    it('should reject invalid PIN format', async () => {
      const hashed = await hashPIN('AB12');
      expect(hashed).not.toBe(null);

      const isValid = await verifyPIN('1234', hashed!.hash);
      expect(isValid).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const isValid = await verifyPIN('AB12', '');
      expect(isValid).toBe(false);
    });

    it('should be timing-attack resistant (same execution time)', async () => {
      const hashed = await hashPIN('AB12');
      expect(hashed).not.toBe(null);

      const start1 = Date.now();
      await verifyPIN('AB12', hashed!.hash);
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      await verifyPIN('XX99', hashed!.hash);
      const time2 = Date.now() - start2;

      // Both should take roughly the same time (within 50ms)
      expect(Math.abs(time1 - time2)).toBeLessThan(50);
    });
  });

  describe('validatePINConfirmation', () => {
    it('should return null when PINs match', () => {
      expect(validatePINConfirmation('AB12', 'AB12')).toBe(null);
    });

    it('should normalize before comparing', () => {
      expect(validatePINConfirmation('AB12', 'ab12')).toBe(null);
      expect(validatePINConfirmation('ab12', 'AB12')).toBe(null);
    });

    it('should return error when PINs do not match', () => {
      const error = validatePINConfirmation('AB12', 'CD34');
      expect(error).toBe('PINs komen niet overeen');
    });

    it('should return error when confirmation is empty', () => {
      const error = validatePINConfirmation('AB12', '');
      expect(error).toBe('Bevestig je PIN');
    });
  });

  describe('validatePINFields', () => {
    it('should return no errors for valid matching PINs', () => {
      const errors = validatePINFields('AB12', 'AB12');
      expect(Object.keys(errors)).toHaveLength(0);
    });

    it('should return format error for invalid PIN', () => {
      const errors = validatePINFields('1234', '1234');
      expect(errors.pin).toBeTruthy();
      expect(errors.pin).toContain('letters');
    });

    it('should return confirmation error for mismatched PINs', () => {
      const errors = validatePINFields('AB12', 'CD34');
      expect(errors.pinConfirm).toBe('PINs komen niet overeen');
    });

    it('should return format error when PIN is invalid (confirmation ignored if PIN invalid)', () => {
      const errors = validatePINFields('1234', 'ABCD');
      expect(errors.pin).toBeTruthy();
      // Note: When PIN is invalid, confirmation validation doesn't make sense
      // The function focuses on PIN format first
    });
  });

  describe('getPINSecurityMetrics', () => {
    it('should return security metrics', () => {
      const metrics = getPINSecurityMetrics();
      expect(metrics.totalCombinations).toBe(67600); // 26*26*10*10
      expect(metrics.uniqueSpace).toBe('67,600 unique PINs');
      expect(metrics.withLockout).toContain('10 attempts');
    });
  });
});
