/**
 * Unit tests for JWT token utilities
 * Tests cover: token creation, verification, cookie management
 *
 * Test Coverage:
 * - LOGIN-017 to LOGIN-019 (Session and JWT tests)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  createToken,
  verifyToken,
  setTokenCookie,
  clearTokenCookie,
  getTokenFromCookies,
  getUserFromRequest,
  hasRole,
  isAdmin,
  isApproved,
  isEmailVerified,
  getTokenExpiryTime,
  type JWTPayload,
} from '@/lib/auth/jwt';
import { NextResponse } from 'next/server';

describe('JWT Token Utilities', () => {
  const mockPayload: JWTPayload = {
    userId: 'test-user-id-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'participant',
    registrationStatus: 'approved',
    emailVerified: true,
  };

  describe('createToken', () => {
    it('should create a valid JWT token (LOGIN-019)', async () => {
      const token = await createToken(mockPayload);
      expect(token).toBeTruthy();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include all payload claims', async () => {
      const token = await createToken(mockPayload);
      const verified = await verifyToken(token);

      expect(verified).not.toBe(null);
      expect(verified?.userId).toBe(mockPayload.userId);
      expect(verified?.email).toBe(mockPayload.email);
      expect(verified?.name).toBe(mockPayload.name);
      expect(verified?.role).toBe(mockPayload.role);
      expect(verified?.registrationStatus).toBe(mockPayload.registrationStatus);
      expect(verified?.emailVerified).toBe(mockPayload.emailVerified);
    });

    it('should set issued at and expiration time', async () => {
      const token = await createToken(mockPayload);
      const verified = await verifyToken(token);

      expect(verified?.iat).toBeTruthy();
      expect(verified?.exp).toBeTruthy();
      expect(verified?.exp).toBeGreaterThan(verified?.iat!);
    });

    it('should create different tokens for same payload (different iat)', async () => {
      const token1 = await createToken(mockPayload);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      const token2 = await createToken(mockPayload);

      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', async () => {
      const token = await createToken(mockPayload);
      const verified = await verifyToken(token);

      expect(verified).not.toBe(null);
      expect(verified?.userId).toBe(mockPayload.userId);
    });

    it('should return null for invalid token', async () => {
      const verified = await verifyToken('invalid.token.here');
      expect(verified).toBe(null);
    });

    it('should return null for empty token', async () => {
      const verified = await verifyToken('');
      expect(verified).toBe(null);
    });

    it('should return null for malformed token', async () => {
      const verified = await verifyToken('not-a-jwt-token');
      expect(verified).toBe(null);
    });

    it('should verify token with different roles', async () => {
      const adminPayload: JWTPayload = { ...mockPayload, role: 'admin' };
      const token = await createToken(adminPayload);
      const verified = await verifyToken(token);

      expect(verified?.role).toBe('admin');
    });

    it('should verify token with different registration statuses', async () => {
      const pendingPayload: JWTPayload = { ...mockPayload, registrationStatus: 'pending' };
      const token = await createToken(pendingPayload);
      const verified = await verifyToken(token);

      expect(verified?.registrationStatus).toBe('pending');
    });
  });

  describe('setTokenCookie', () => {
    it('should set httpOnly cookie in response (LOGIN-019)', () => {
      const response = NextResponse.json({ success: true });
      const token = 'test-jwt-token';

      const modifiedResponse = setTokenCookie(response, token);
      const cookies = modifiedResponse.cookies.getAll();

      const authCookie = cookies.find(c => c.name === 'bovenkamer_auth_token');
      expect(authCookie).toBeTruthy();
      expect(authCookie?.value).toBe(token);
    });

    it('should set cookie with correct security flags', () => {
      const response = NextResponse.json({ success: true });
      const token = 'test-jwt-token';

      const modifiedResponse = setTokenCookie(response, token);
      const cookies = modifiedResponse.cookies.getAll();
      const authCookie = cookies.find(c => c.name === 'bovenkamer_auth_token');

      // Note: In test environment, secure should be false
      expect(authCookie?.httpOnly).toBe(true);
      expect(authCookie?.sameSite).toBe('lax');
      expect(authCookie?.path).toBe('/');
    });

    it('should set cookie with 30-day maxAge', () => {
      const response = NextResponse.json({ success: true });
      const token = 'test-jwt-token';

      const modifiedResponse = setTokenCookie(response, token);
      const cookies = modifiedResponse.cookies.getAll();
      const authCookie = cookies.find(c => c.name === 'bovenkamer_auth_token');

      const expectedMaxAge = 30 * 24 * 60 * 60; // 30 days in seconds
      expect(authCookie?.maxAge).toBe(expectedMaxAge);
    });
  });

  describe('clearTokenCookie', () => {
    it('should clear token cookie (LOGIN-018)', () => {
      const response = NextResponse.json({ success: true });
      const modifiedResponse = clearTokenCookie(response);
      const cookies = modifiedResponse.cookies.getAll();

      const authCookie = cookies.find(c => c.name === 'bovenkamer_auth_token');
      expect(authCookie).toBeTruthy();
      expect(authCookie?.value).toBe('');
      expect(authCookie?.maxAge).toBe(0);
    });
  });

  describe('getTokenFromCookies', () => {
    it('should extract token from cookies', () => {
      const mockCookies = {
        get: (name: string) => ({
          name: 'bovenkamer_auth_token',
          value: 'test-token-value',
        }),
      };

      const token = getTokenFromCookies(mockCookies);
      expect(token).toBe('test-token-value');
    });

    it('should return null when cookie not present', () => {
      const mockCookies = {
        get: (name: string) => undefined,
      };

      const token = getTokenFromCookies(mockCookies);
      expect(token).toBe(null);
    });
  });

  describe('getUserFromRequest', () => {
    it('should extract and verify user from request', async () => {
      const token = await createToken(mockPayload);
      const mockRequest = {
        cookies: {
          get: () => ({ value: token }),
        },
      };

      const user = await getUserFromRequest(mockRequest);
      expect(user).not.toBe(null);
      expect(user?.userId).toBe(mockPayload.userId);
      expect(user?.email).toBe(mockPayload.email);
    });

    it('should return null when no token in cookies', async () => {
      const mockRequest = {
        cookies: {
          get: () => undefined,
        },
      };

      const user = await getUserFromRequest(mockRequest);
      expect(user).toBe(null);
    });

    it('should return null when token is invalid', async () => {
      const mockRequest = {
        cookies: {
          get: () => ({ value: 'invalid-token' }),
        },
      };

      const user = await getUserFromRequest(mockRequest);
      expect(user).toBe(null);
    });
  });

  describe('hasRole', () => {
    it('should return true for matching role', async () => {
      const token = await createToken(mockPayload);
      const verified = await verifyToken(token);

      expect(hasRole(verified, 'participant')).toBe(true);
    });

    it('should return false for non-matching role', async () => {
      const token = await createToken(mockPayload);
      const verified = await verifyToken(token);

      expect(hasRole(verified, 'admin')).toBe(false);
    });

    it('should handle array of roles', async () => {
      const token = await createToken(mockPayload);
      const verified = await verifyToken(token);

      expect(hasRole(verified, ['participant', 'admin'])).toBe(true);
      expect(hasRole(verified, ['admin', 'quizmaster'])).toBe(false);
    });

    it('should return false for null payload', () => {
      expect(hasRole(null, 'participant')).toBe(false);
    });
  });

  describe('isAdmin', () => {
    it('should return true for admin user', async () => {
      const adminPayload: JWTPayload = { ...mockPayload, role: 'admin' };
      const token = await createToken(adminPayload);
      const verified = await verifyToken(token);

      expect(isAdmin(verified)).toBe(true);
    });

    it('should return false for non-admin user', async () => {
      const token = await createToken(mockPayload);
      const verified = await verifyToken(token);

      expect(isAdmin(verified)).toBe(false);
    });

    it('should return false for null payload', () => {
      expect(isAdmin(null)).toBe(false);
    });
  });

  describe('isApproved', () => {
    it('should return true for approved registration', async () => {
      const token = await createToken(mockPayload);
      const verified = await verifyToken(token);

      expect(isApproved(verified)).toBe(true);
    });

    it('should return false for pending registration', async () => {
      const pendingPayload: JWTPayload = { ...mockPayload, registrationStatus: 'pending' };
      const token = await createToken(pendingPayload);
      const verified = await verifyToken(token);

      expect(isApproved(verified)).toBe(false);
    });

    it('should return false for rejected registration', async () => {
      const rejectedPayload: JWTPayload = { ...mockPayload, registrationStatus: 'rejected' };
      const token = await createToken(rejectedPayload);
      const verified = await verifyToken(token);

      expect(isApproved(verified)).toBe(false);
    });

    it('should return false for null payload', () => {
      expect(isApproved(null)).toBe(false);
    });
  });

  describe('isEmailVerified', () => {
    it('should return true for verified email', async () => {
      const token = await createToken(mockPayload);
      const verified = await verifyToken(token);

      expect(isEmailVerified(verified)).toBe(true);
    });

    it('should return false for unverified email (LOGIN-014)', async () => {
      const unverifiedPayload: JWTPayload = { ...mockPayload, emailVerified: false };
      const token = await createToken(unverifiedPayload);
      const verified = await verifyToken(token);

      expect(isEmailVerified(verified)).toBe(false);
    });

    it('should return false for null payload', () => {
      expect(isEmailVerified(null)).toBe(false);
    });
  });

  describe('getTokenExpiryTime', () => {
    it('should return remaining time until expiration', async () => {
      const token = await createToken(mockPayload);
      const verified = await verifyToken(token);

      const remaining = getTokenExpiryTime(verified);
      expect(remaining).toBeGreaterThan(0);
      // Should be approximately 30 days in seconds
      expect(remaining).toBeGreaterThan(29 * 24 * 60 * 60);
      expect(remaining).toBeLessThan(31 * 24 * 60 * 60);
    });

    it('should return null for payload without expiration', () => {
      const payloadWithoutExp: any = { ...mockPayload };
      delete payloadWithoutExp.exp;

      const remaining = getTokenExpiryTime(payloadWithoutExp);
      expect(remaining).toBe(null);
    });

    it('should return 0 for expired token', () => {
      const expiredPayload: any = {
        ...mockPayload,
        exp: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };

      const remaining = getTokenExpiryTime(expiredPayload);
      expect(remaining).toBe(0);
    });

    it('should return null for null payload', () => {
      expect(getTokenExpiryTime(null)).toBe(null);
    });
  });
});
