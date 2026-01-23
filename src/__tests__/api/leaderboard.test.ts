/**
 * Integration tests for Leaderboard API route
 * Tests cover leaderboard and ranking functionality from TEST_PLAN.md
 *
 * Test Coverage:
 * - PROF-023: Leaderboard loads top users
 * - PROF-024: Leaderboard sorted by points descending
 * - PROF-025: Current user rank shown
 * - PROF-026: Users with 0 points appear in leaderboard
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '@/app/api/leaderboard/route';
import { NextRequest } from 'next/server';

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  createServerClient: vi.fn(() => ({
    from: vi.fn(),
  })),
}));

import { createServerClient } from '@/lib/supabase';

describe('Leaderboard API Route', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = {
      from: vi.fn(),
    };
    vi.mocked(createServerClient).mockReturnValue(mockSupabase);
  });

  const createMockRequest = (url: string): NextRequest => {
    return {
      url: `http://localhost:3000${url}`,
    } as NextRequest;
  };

  describe('Leaderboard Loading (PROF-023)', () => {
    it('should load leaderboard successfully', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
      ];

      const mockPoints = [
        { user_id: 'user-1', points: 100 },
        { user_id: 'user-2', points: 50 },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'points_ledger') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockPoints, error: null }),
          };
        }
        if (table === 'users') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const request = createMockRequest('/api/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard).toBeDefined();
      expect(data.leaderboard.length).toBeLessThanOrEqual(10);
      expect(data.totalParticipants).toBe(2);
    });

    it('should handle database error gracefully', async () => {
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'points_ledger') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Database error' }
            }),
          };
        }
        return { select: vi.fn() };
      });

      const request = createMockRequest('/api/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Kon leaderboard niet ophalen');
    });
  });

  describe('Points Aggregation and Sorting (PROF-024)', () => {
    it('should aggregate points per user correctly', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
      ];

      const mockPoints = [
        { user_id: 'user-1', points: 50 },
        { user_id: 'user-1', points: 30 },
        { user_id: 'user-1', points: 20 },
        { user_id: 'user-2', points: 40 },
        { user_id: 'user-2', points: 10 },
      ];

      let selectCallCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'points_ledger') {
          selectCallCount++;
          return {
            select: vi.fn(() => {
              // First call with joins, second call for aggregation
              if (selectCallCount === 1) {
                return {
                  order: vi.fn().mockResolvedValue({ data: mockPoints, error: null }),
                };
              } else {
                return Promise.resolve({ data: mockPoints, error: null });
              }
            }),
          };
        }
        if (table === 'users') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const request = createMockRequest('/api/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard[0].points).toBe(100); // Alice: 50+30+20
      expect(data.leaderboard[1].points).toBe(50);  // Bob: 40+10
    });

    it('should sort leaderboard by points descending (PROF-024)', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        { id: 'user-3', name: 'Charlie', email: 'charlie@example.com' },
      ];

      const mockPoints = [
        { user_id: 'user-1', points: 50 },
        { user_id: 'user-2', points: 150 },
        { user_id: 'user-3', points: 100 },
      ];

      let selectCallCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'points_ledger') {
          selectCallCount++;
          return {
            select: vi.fn(() => {
              if (selectCallCount === 1) {
                return {
                  order: vi.fn().mockResolvedValue({ data: mockPoints, error: null }),
                };
              } else {
                return Promise.resolve({ data: mockPoints, error: null });
              }
            }),
          };
        }
        if (table === 'users') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const request = createMockRequest('/api/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard[0].points).toBe(150); // Bob
      expect(data.leaderboard[0].rank).toBe(1);
      expect(data.leaderboard[1].points).toBe(100); // Charlie
      expect(data.leaderboard[1].rank).toBe(2);
      expect(data.leaderboard[2].points).toBe(50);  // Alice
      expect(data.leaderboard[2].rank).toBe(3);
    });

    it('should limit leaderboard to top 10 users', async () => {
      const mockUsers = Array.from({ length: 15 }, (_, i) => ({
        id: `user-${i}`,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      const mockPoints = Array.from({ length: 15 }, (_, i) => ({
        user_id: `user-${i}`,
        points: (15 - i) * 10,
      }));

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'points_ledger') {
          const mock = {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockPoints, error: null }),
          };
          return mock;
        }
        if (table === 'users') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const request = createMockRequest('/api/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard.length).toBe(10);
      expect(data.totalParticipants).toBe(15);
    });
  });

  describe('Current User Rank (PROF-025)', () => {
    it('should return current user rank when email provided', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        { id: 'user-3', name: 'Charlie', email: 'charlie@example.com' },
      ];

      const mockPoints = [
        { user_id: 'user-1', points: 150 },
        { user_id: 'user-2', points: 100 },
        { user_id: 'user-3', points: 50 },
      ];

      let selectCallCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'points_ledger') {
          selectCallCount++;
          return {
            select: vi.fn(() => {
              if (selectCallCount === 1) {
                return {
                  order: vi.fn().mockResolvedValue({ data: mockPoints, error: null }),
                };
              } else {
                return Promise.resolve({ data: mockPoints, error: null });
              }
            }),
          };
        }
        if (table === 'users') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const request = createMockRequest('/api/leaderboard?email=bob@example.com');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currentUser).toBeDefined();
      expect(data.currentUser.rank).toBe(2);
      expect(data.currentUser.points).toBe(100);
    });

    it('should return null for current user when no email provided', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
      ];

      const mockPoints = [
        { user_id: 'user-1', points: 100 },
      ];

      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'points_ledger') {
          const mock = {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({ data: mockPoints, error: null }),
          };
          return mock;
        }
        if (table === 'users') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const request = createMockRequest('/api/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.currentUser).toBeNull();
    });
  });

  describe('Users with Zero Points (PROF-026)', () => {
    it('should include users with no points entries (PROF-026)', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        { id: 'user-3', name: 'Charlie', email: 'charlie@example.com' },
      ];

      const mockPoints = [
        { user_id: 'user-1', points: 100 },
        // user-2 and user-3 have no points entries
      ];

      let selectCallCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'points_ledger') {
          selectCallCount++;
          return {
            select: vi.fn(() => {
              if (selectCallCount === 1) {
                return {
                  order: vi.fn().mockResolvedValue({ data: mockPoints, error: null }),
                };
              } else {
                return Promise.resolve({ data: mockPoints, error: null });
              }
            }),
          };
        }
        if (table === 'users') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const request = createMockRequest('/api/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.totalParticipants).toBe(3);

      // Find users with 0 points
      const usersWithZeroPoints = data.leaderboard.filter((u: any) => u.points === 0);
      expect(usersWithZeroPoints.length).toBe(2);

      // Verify they have proper user data
      const bobEntry = data.leaderboard.find((u: any) => u.email === 'bob@example.com');
      expect(bobEntry).toBeDefined();
      expect(bobEntry.points).toBe(0);
      expect(bobEntry.name).toBe('Bob');
    });

    it('should rank users with 0 points after users with points', async () => {
      const mockUsers = [
        { id: 'user-1', name: 'Alice', email: 'alice@example.com' },
        { id: 'user-2', name: 'Bob', email: 'bob@example.com' },
        { id: 'user-3', name: 'Charlie', email: 'charlie@example.com' },
      ];

      const mockPoints = [
        { user_id: 'user-1', points: 50 },
        // user-2 and user-3 have no points
      ];

      let selectCallCount = 0;
      mockSupabase.from.mockImplementation((table: string) => {
        if (table === 'points_ledger') {
          selectCallCount++;
          return {
            select: vi.fn(() => {
              if (selectCallCount === 1) {
                return {
                  order: vi.fn().mockResolvedValue({ data: mockPoints, error: null }),
                };
              } else {
                return Promise.resolve({ data: mockPoints, error: null });
              }
            }),
          };
        }
        if (table === 'users') {
          return {
            select: vi.fn().mockResolvedValue({ data: mockUsers, error: null }),
          };
        }
        return { select: vi.fn() };
      });

      const request = createMockRequest('/api/leaderboard');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.leaderboard[0].points).toBe(50);
      expect(data.leaderboard[0].rank).toBe(1);
      expect(data.leaderboard[1].points).toBe(0);
      expect(data.leaderboard[1].rank).toBe(2);
      expect(data.leaderboard[2].points).toBe(0);
      expect(data.leaderboard[2].rank).toBe(3);
    });
  });
});
