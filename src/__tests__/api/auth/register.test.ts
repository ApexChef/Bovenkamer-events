/**
 * Integration tests for registration API route
 * Tests cover registration functionality from TEST_PLAN.md
 *
 * Test Coverage:
 * - REG-004 to REG-010: Input validation
 * - REG-018 to REG-022: Email verification flow
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { POST } from '@/app/api/auth/register/route';
import { GET } from '@/app/api/auth/verify-email/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(),
  })),
}));

// Mock rate limiting
vi.mock('@/lib/auth/rate-limit', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    checkCombinedRateLimit: vi.fn().mockResolvedValue({
      allowed: true,
      remainingAttempts: 10,
      resetAt: new Date(Date.now() + 900000),
    }),
    getClientIP: vi.fn().mockReturnValue('127.0.0.1'),
  };
});

// Mock email service
vi.mock('@/lib/auth/email-service', async (importOriginal) => {
  const actual = await importOriginal() as any;
  return {
    ...actual,
    sendVerificationEmail: vi.fn().mockResolvedValue({ success: true }),
  };
});

import { createServerClient } from '@/lib/supabase';

describe('Registration API Route', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn(),
    };

    vi.mocked(createServerClient).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createMockRequest = (body: any): NextRequest => {
    return {
      json: async () => body,
      headers: new Headers({
        'x-forwarded-for': '127.0.0.1',
      }),
    } as NextRequest;
  };

  describe('Input Validation', () => {
    it('should reject empty name (REG-004)', async () => {
      const request = createMockRequest({
        name: '',
        email: 'test@example.com',
        pin: 'AB12',
        pinConfirm: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.fields.name).toContain('verplicht');
    });

    it('should reject empty email (REG-005)', async () => {
      const request = createMockRequest({
        name: 'Test User',
        email: '',
        pin: 'AB12',
        pinConfirm: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.fields.email).toContain('verplicht');
    });

    it('should reject invalid email format (REG-006)', async () => {
      const request = createMockRequest({
        name: 'Test User',
        email: 'notanemail',
        pin: 'AB12',
        pinConfirm: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.fields.email).toContain('Ongeldig email adres');
    });

    it('should reject duplicate email (REG-007)', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'existing-user',
                email: 'test@example.com',
                registration_status: 'approved',
              },
              error: null,
            }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
      });

      const request = createMockRequest({
        name: 'Test User',
        email: 'test@example.com',
        pin: 'AB12',
        pinConfirm: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBe('EMAIL_EXISTS');
      expect(data.message).toContain('al geregistreerd');
    });

    it('should reject PIN confirmation mismatch (REG-008)', async () => {
      const request = createMockRequest({
        name: 'Test User',
        email: 'test@example.com',
        pin: 'AB12',
        pinConfirm: 'CD34',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.fields.pinConfirm).toContain('komen niet overeen');
    });

    it('should reject invalid PIN format (REG-009)', async () => {
      const request = createMockRequest({
        name: 'Test User',
        email: 'test@example.com',
        pin: '1234',
        pinConfirm: '1234',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.fields.pin).toBeTruthy();
    });

    it('should reject missing PIN confirmation (REG-010)', async () => {
      const request = createMockRequest({
        name: 'Test User',
        email: 'test@example.com',
        pin: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('VALIDATION_ERROR');
      expect(data.fields.pinConfirm).toContain('verplicht');
    });
  });

  describe('Successful Registration', () => {
    it('should create user and send verification email', async () => {
      const newUser = {
        id: 'new-user-123',
        email: 'new@example.com',
        name: 'New User',
        registration_status: 'pending',
        profile_completion: 0,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            insert: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'auth_pins') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === 'email_verifications') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), insert: vi.fn() };
      });

      // Mock the insert response for users
      mockSupabase.from = vi.fn((table: string) => {
        if (table === 'users' && table) {
          const chain = {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({ data: newUser, error: null }),
              }),
            }),
          };
          return chain;
        }
        if (table === 'auth_pins') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        if (table === 'email_verifications') {
          return {
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), insert: vi.fn() };
      });

      const request = createMockRequest({
        name: 'New User',
        email: 'new@example.com',
        pin: 'AB12',
        pinConfirm: 'AB12',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.userId).toBe('new-user-123');
      expect(data.nextStep).toBe('email-verification');
    });
  });
});

describe('Email Verification API Route', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSupabase = {
      from: vi.fn(),
    };

    vi.mocked(createServerClient).mockReturnValue(mockSupabase);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const createMockGetRequest = (token?: string): NextRequest => {
    const url = token
      ? `http://localhost:3000/api/auth/verify-email?token=${token}`
      : 'http://localhost:3000/api/auth/verify-email';

    return {
      nextUrl: new URL(url),
      url,
    } as NextRequest;
  };

  describe('Email Verification', () => {
    it('should reject missing token (REG-018)', async () => {
      const request = createMockGetRequest();
      const response = await GET(request);

      expect(response.status).toBe(400);
      expect(response.headers.get('content-type')).toContain('text/html');
      const html = await response.text();
      expect(html).toContain('Ongeldige Link');
    });

    it('should reject invalid token (REG-019)', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'email_verifications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
      });

      const request = createMockGetRequest('invalid-token');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const html = await response.text();
      expect(html).toContain('Ongeldige Token');
    });

    it('should reject expired token (REG-020)', async () => {
      const expiredDate = new Date(Date.now() - 1000); // 1 second ago

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'email_verifications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'verification-1',
                user_id: 'user-123',
                expires_at: expiredDate.toISOString(),
                verified_at: null,
              },
              error: null,
            }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
      });

      const request = createMockGetRequest('expired-token');
      const response = await GET(request);

      expect(response.status).toBe(400);
      const html = await response.text();
      expect(html).toContain('Link Verlopen');
    });

    it('should handle already verified token (REG-021)', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'email_verifications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'verification-1',
                user_id: 'user-123',
                expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
                verified_at: new Date().toISOString(),
              },
              error: null,
            }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
      });

      const request = createMockGetRequest('already-verified-token');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('verified=already');
    });

    it('should verify valid token and update user (REG-022)', async () => {
      const futureDate = new Date(Date.now() + 48 * 60 * 60 * 1000);

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'email_verifications') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: {
                id: 'verification-1',
                user_id: 'user-123',
                expires_at: futureDate.toISOString(),
                verified_at: null,
              },
              error: null,
            }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'users') {
          return {
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn() };
      });

      const request = createMockGetRequest('valid-token');
      const response = await GET(request);

      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('verified=true');
    });
  });
});
