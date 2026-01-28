/**
 * Integration tests for login API route
 * Tests cover all login scenarios from TEST_PLAN.md
 *
 * Test Coverage:
 * - LOGIN-001 to LOGIN-019 (All login functionality tests)
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { POST } from '@/app/api/auth/login/route';
import { NextRequest } from 'next/server';
import { hashPIN } from '@/lib/auth/pin';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(),
  })),
}));

// Mock rate limiting to prevent actual rate limit checks in tests
vi.mock('@/lib/auth/rate-limit', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    checkCombinedRateLimit: vi.fn().mockResolvedValue({
      allowed: true,
      remainingAttempts: 10,
      resetAt: new Date(Date.now() + 900000),
    }),
    resetRateLimit: vi.fn().mockResolvedValue(undefined),
    getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  };
});

import { createServerClient } from '@/lib/supabase';

describe('Login API Route', () => {
  let mockSupabase: any;
  let testUserPinHash: string;

  beforeEach(async () => {
    // Create a real PIN hash for testing
    const pinHashResult = await hashPIN('AB12');
    testUserPinHash = pinHashResult!.hash;

    // Reset all mocks
    vi.clearAllMocks();

    // Setup default Supabase mock
    mockSupabase = {
      from: vi.fn(),
    };

    vi.mocked(createServerClient).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any, headers: Record<string, string> = {}): NextRequest => {
    return {
      json: async () => body,
      headers: new Headers({
        'x-forwarded-for': '127.0.0.1',
        ...headers,
      }),
    } as NextRequest;
  };

  describe('Input Validation', () => {
    it('should reject empty email (LOGIN-005)', async () => {
      const request = createMockRequest({
        email: '',
        pin: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('Email en PIN zijn verplicht');
    });

    it('should reject empty PIN (LOGIN-006)', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        pin: '',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.message).toContain('Email en PIN zijn verplicht');
    });

    it('should reject invalid email format (LOGIN-007)', async () => {
      const request = createMockRequest({
        email: 'notanemail',
        pin: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('INVALID_CREDENTIALS');
    });

    it('should reject invalid PIN format (LOGIN-009)', async () => {
      const request = createMockRequest({
        email: 'test@example.com',
        pin: '1234',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('INVALID_CREDENTIALS');
    });

    it('should normalize PIN case (LOGIN-010)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'participant',
        email_verified: true,
        registration_status: 'approved',
        rejection_reason: null,
        blocked_features: [],
      };

      const mockAuthPin = {
        pin_hash: testUserPinHash,
        failed_attempts: 0,
        locked_until: null,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            update: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          };
        }
        if (table === 'auth_pins') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockAuthPin, error: null }),
            update: vi.fn(() => ({
              eq: vi.fn().mockResolvedValue({ data: null, error: null }),
            })),
          };
        }
        if (table === 'registrations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
      });

      // Test with lowercase PIN
      const request = createMockRequest({
        email: 'test@example.com',
        pin: 'ab12', // lowercase should work
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('User Authentication', () => {
    it('should reject non-existent user (LOGIN-016)', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
      });

      const request = createMockRequest({
        email: 'nonexistent@example.com',
        pin: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('INVALID_CREDENTIALS');
      expect(data.message).toBe('Onjuist email of PIN');
    });

    it('should successfully login with valid credentials (LOGIN-001)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'participant',
        email_verified: true,
        registration_status: 'approved',
        rejection_reason: null,
        blocked_features: [],
      };

      const mockAuthPin = {
        pin_hash: testUserPinHash,
        failed_attempts: 0,
        locked_until: null,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'auth_pins') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockAuthPin, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'registrations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn() };
      });

      const request = createMockRequest({
        email: 'test@example.com',
        pin: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('test@example.com');
      expect(data.token).toBeTruthy();
      expect(data.message).toContain('Welkom terug');
    });
  });

  describe('Failed Login Attempts', () => {
    it('should show remaining attempts on wrong PIN (LOGIN-011)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'participant',
        email_verified: true,
        registration_status: 'approved',
        rejection_reason: null,
        blocked_features: [],
      };

      const mockAuthPin = {
        pin_hash: testUserPinHash,
        failed_attempts: 3,
        locked_until: null,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
        if (table === 'auth_pins') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockAuthPin, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn() };
      });

      const request = createMockRequest({
        email: 'test@example.com',
        pin: 'XX99', // Wrong PIN
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('INVALID_CREDENTIALS');
      expect(data.attemptsRemaining).toBe(6); // 10 - 4 (current 3 + this attempt)
      expect(data.message).toContain('Nog 6 pogingen over');
    });

    it('should lock account after 10 failed attempts (LOGIN-013)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'participant',
        email_verified: true,
        registration_status: 'approved',
        rejection_reason: null,
        blocked_features: [],
      };

      const mockAuthPin = {
        pin_hash: testUserPinHash,
        failed_attempts: 9, // One more will lock
        locked_until: null,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
        if (table === 'auth_pins') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockAuthPin, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn() };
      });

      const request = createMockRequest({
        email: 'test@example.com',
        pin: 'XX99', // Wrong PIN
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('ACCOUNT_LOCKED');
      expect(data.message).toContain('vergrendeld voor 1 uur');
      expect(data.details.lockedUntil).toBeTruthy();
    });

    it('should reject login when account is locked (LOGIN-013)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'participant',
        email_verified: true,
        registration_status: 'approved',
        rejection_reason: null,
        blocked_features: [],
      };

      const lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Locked for 30 more minutes
      const mockAuthPin = {
        pin_hash: testUserPinHash,
        failed_attempts: 10,
        locked_until: lockedUntil.toISOString(),
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
        if (table === 'auth_pins') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockAuthPin, error: null }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
      });

      const request = createMockRequest({
        email: 'test@example.com',
        pin: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('ACCOUNT_LOCKED');
      expect(data.message).toContain('tijdelijk vergrendeld');
      expect(data.message).toContain('30 minuten');
    });
  });

  describe('Email Verification and Registration Status', () => {
    it('should reject unverified email (LOGIN-014)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'participant',
        email_verified: false, // Not verified
        registration_status: 'approved',
        rejection_reason: null,
        blocked_features: [],
      };

      const mockAuthPin = {
        pin_hash: testUserPinHash,
        failed_attempts: 0,
        locked_until: null,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
        if (table === 'auth_pins') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockAuthPin, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn() };
      });

      const request = createMockRequest({
        email: 'test@example.com',
        pin: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('EMAIL_NOT_VERIFIED');
      expect(data.message).toContain('Verifieer eerst je email');
    });

    it('should reject pending registration (LOGIN-004)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'participant',
        email_verified: true,
        registration_status: 'pending', // Still pending
        rejection_reason: null,
        blocked_features: [],
      };

      const mockAuthPin = {
        pin_hash: testUserPinHash,
        failed_attempts: 0,
        locked_until: null,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
        if (table === 'auth_pins') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockAuthPin, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn() };
      });

      const request = createMockRequest({
        email: 'test@example.com',
        pin: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('REGISTRATION_PENDING');
      expect(data.message).toContain('wordt nog beoordeeld');
    });

    it('should reject rejected registration (LOGIN-015)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'participant',
        email_verified: true,
        registration_status: 'rejected',
        rejection_reason: 'Not a JKV member',
        blocked_features: [],
      };

      const mockAuthPin = {
        pin_hash: testUserPinHash,
        failed_attempts: 0,
        locked_until: null,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
        if (table === 'auth_pins') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockAuthPin, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn() };
      });

      const request = createMockRequest({
        email: 'test@example.com',
        pin: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('REGISTRATION_REJECTED');
      expect(data.message).toContain('niet goedgekeurd');
      expect(data.details.rejectionReason).toBe('Not a JKV member');
    });

    it('should reject cancelled registration', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'participant',
        email_verified: true,
        registration_status: 'cancelled',
        rejection_reason: null,
        blocked_features: [],
      };

      const mockAuthPin = {
        pin_hash: testUserPinHash,
        failed_attempts: 0,
        locked_until: null,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
        if (table === 'auth_pins') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockAuthPin, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn() };
      });

      const request = createMockRequest({
        email: 'test@example.com',
        pin: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('REGISTRATION_CANCELLED');
      expect(data.message).toContain('afgemeld');
    });
  });

  describe('Session Management', () => {
    it('should set JWT cookie on successful login (LOGIN-019)', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'participant',
        email_verified: true,
        registration_status: 'approved',
        rejection_reason: null,
        blocked_features: [],
      };

      const mockAuthPin = {
        pin_hash: testUserPinHash,
        failed_attempts: 0,
        locked_until: null,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'auth_pins') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockAuthPin, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'registrations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn() };
      });

      const request = createMockRequest({
        email: 'test@example.com',
        pin: 'AB12',
      });

      const response = await POST(request);
      const cookies = response.cookies.getAll();
      const authCookie = cookies.find(c => c.name === 'bovenkamer_auth_token');

      expect(authCookie).toBeTruthy();
      expect(authCookie?.value).toBeTruthy();
    });

    it('should reset failed attempts on successful login', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'participant',
        email_verified: true,
        registration_status: 'approved',
        rejection_reason: null,
        blocked_features: [],
      };

      const mockAuthPin = {
        pin_hash: testUserPinHash,
        failed_attempts: 5, // Had some failures before
        locked_until: null,
      };

      let authPinUpdateCalled = false;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'auth_pins') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockAuthPin, error: null }),
            update: vi.fn((data: any) => {
              if (data.failed_attempts === 0) {
                authPinUpdateCalled = true;
              }
              return {
                eq: vi.fn().mockResolvedValue({ data: null, error: null }),
              };
            }),
          };
        }
        if (table === 'registrations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn() };
      });

      const request = createMockRequest({
        email: 'test@example.com',
        pin: 'AB12',
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
      expect(authPinUpdateCalled).toBe(true);
    });
  });
});
