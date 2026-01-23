/**
 * Integration tests for Profile API route
 * Tests cover profile and points functionality from TEST_PLAN.md
 *
 * Test Coverage:
 * - PROF-001: Load profile page returns data
 * - PROF-002: Profile data synced from DB
 * - PROF-003: Profile sections completeness tracking
 * - PROF-019: Points calculation (up to 260 max)
 * - PROF-020: No duplicate points
 * - PROF-021: Points display correctly
 * - PROF-022: Section completion status
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET, POST } from '@/app/api/profile/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(),
  })),
}));

import { createServerClient } from '@/lib/supabase';

describe('Profile API Route', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn(),
    };
    vi.mocked(createServerClient).mockReturnValue(mockSupabase);
  });

  const createMockRequest = (url: string, body?: any): NextRequest => {
    const request = {
      url: `http://localhost:3000${url}`,
      json: async () => body,
    } as NextRequest;
    return request;
  };

  describe('GET Profile - Data Loading (PROF-001, PROF-002)', () => {
    it('should return 400 when email is missing', async () => {
      const request = createMockRequest('/api/profile');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email is required');
    });

    it('should return 404 when user not found', async () => {
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

      const request = createMockRequest('/api/profile?email=nonexistent@example.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should load profile data successfully (PROF-001)', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const mockRegistration = {
        user_id: 'user-123',
        birth_date: '1990-01-15',
        birth_year: 1990,
        has_partner: true,
        partner_name: 'Jane Doe',
        dietary_requirements: 'Vegetarian',
        skills: { 'BBQ Master': 'Expert at grilling' },
        additional_skills: 'Guitar playing',
        music_decade: '90s',
        music_genre: 'Rock',
        jkv_join_year: 2010,
        jkv_exit_year: null,
        bovenkamer_join_year: 2015,
        borrel_count_2025: 12,
        borrel_planning_2026: 15,
        quiz_answers: { q1: 'answer1' },
        ai_assignment: 'Bring dessert',
        attendance_confirmed: true,
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
        if (table === 'registrations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockRegistration, error: null }),
          };
        }
        if (table === 'points_ledger') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            insert: vi.fn().mockResolvedValue({ data: null, error: null }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
      });

      const request = createMockRequest('/api/profile?email=test@example.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toEqual(mockUser);
      expect(data.profile.birthYear).toBe(1990);
      expect(data.profile.hasPartner).toBe(true);
      expect(data.profile.borrelCount2025).toBe(12);
    });

    it('should return null profile when no registration exists', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
        if (table === 'registrations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn() };
      });

      const request = createMockRequest('/api/profile?email=test@example.com');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.user).toEqual(mockUser);
      expect(data.profile).toBeNull();
    });
  });

  describe('Points System (PROF-019, PROF-020, PROF-021)', () => {
    it('should award basic points on first profile load (PROF-020)', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const mockRegistration = {
        user_id: 'user-123',
        birth_date: null,
        birth_year: null,
        has_partner: false,
        partner_name: null,
        dietary_requirements: null,
        skills: {},
        additional_skills: null,
        music_decade: null,
        music_genre: null,
        jkv_join_year: null,
        jkv_exit_year: null,
        bovenkamer_join_year: null,
        borrel_count_2025: 0,
        borrel_planning_2026: 0,
        quiz_answers: {},
        ai_assignment: null,
        attendance_confirmed: false,
      };

      let basicPointsAwarded = false;

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
        if (table === 'registrations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockRegistration, error: null }),
          };
        }
        if (table === 'points_ledger') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            insert: vi.fn((data: any) => {
              if (data.description === 'profile_basic' && data.points === 10) {
                basicPointsAwarded = true;
              }
              return Promise.resolve({ data: null, error: null });
            }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), insert: vi.fn() };
      });

      const request = createMockRequest('/api/profile?email=test@example.com');
      await GET(request);

      expect(basicPointsAwarded).toBe(true);
    });

    it('should NOT award duplicate basic points (PROF-020)', async () => {
      const mockUser = {
        id: 'user-123',
        name: 'Test User',
        email: 'test@example.com',
      };

      const existingPointsEntries = [
        { description: 'profile_basic' },
      ];

      let insertCalled = false;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
        if (table === 'registrations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          };
        }
        if (table === 'points_ledger') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ data: existingPointsEntries, error: null }),
            insert: vi.fn(() => {
              insertCalled = true;
              return Promise.resolve({ data: null, error: null });
            }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), insert: vi.fn() };
      });

      const request = createMockRequest('/api/profile?email=test@example.com');
      await GET(request);

      expect(insertCalled).toBe(false);
    });
  });

  describe('POST Profile - Section Updates (PROF-003, PROF-022)', () => {
    it('should validate required fields', async () => {
      const request = createMockRequest('/api/profile', {
        email: 'test@example.com',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Email and section are required');
    });

    it('should return 404 for non-existent user', async () => {
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

      const request = createMockRequest('/api/profile', {
        email: 'nonexistent@example.com',
        section: 'personal',
        data: { birthYear: 1990 },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('User not found');
    });

    it('should save personal section and award points (PROF-019)', async () => {
      const mockUser = { id: 'user-123' };
      const mockRegistration = { id: 'reg-123' };

      let pointsAwarded = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
        if (table === 'registrations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockRegistration, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'points_ledger') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            insert: vi.fn((data: any) => {
              if (data.description === 'profile_personal') {
                pointsAwarded = data.points;
              }
              return Promise.resolve({ data: null, error: null });
            }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn(), insert: vi.fn() };
      });

      const request = createMockRequest('/api/profile', {
        email: 'test@example.com',
        section: 'personal',
        data: { birthYear: 1990, birthDate: '1990-01-15' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.pointsAwarded).toBe(50);
      expect(pointsAwarded).toBe(50);
    });

    it('should NOT award duplicate section points (PROF-020)', async () => {
      const mockUser = { id: 'user-123' };
      const mockRegistration = { id: 'reg-123' };
      const existingPoints = { id: 'points-123', description: 'profile_skills' };

      let insertCalled = false;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
        if (table === 'registrations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockRegistration, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'points_ledger') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: existingPoints, error: null }),
            insert: vi.fn(() => {
              insertCalled = true;
              return Promise.resolve({ data: null, error: null });
            }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn(), insert: vi.fn() };
      });

      const request = createMockRequest('/api/profile', {
        email: 'test@example.com',
        section: 'skills',
        data: { skills: { 'BBQ': 'Expert' } },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pointsAwarded).toBe(0);
      expect(insertCalled).toBe(false);
    });

    it('should NOT award points for invalid section data', async () => {
      const mockUser = { id: 'user-123' };
      const mockRegistration = { id: 'reg-123' };

      let pointsAwarded = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'users') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockUser, error: null }),
          };
        }
        if (table === 'registrations') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: mockRegistration, error: null }),
            update: vi.fn().mockReturnThis(),
          };
        }
        if (table === 'points_ledger') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
            insert: vi.fn((data: any) => {
              pointsAwarded = data.points;
              return Promise.resolve({ data: null, error: null });
            }),
          };
        }
        return { select: vi.fn(), eq: vi.fn(), single: vi.fn(), update: vi.fn(), insert: vi.fn() };
      });

      const request = createMockRequest('/api/profile', {
        email: 'test@example.com',
        section: 'skills',
        data: { skills: {} }, // Empty skills object is invalid
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.pointsAwarded).toBe(0);
      expect(pointsAwarded).toBe(0);
    });
  });
});
