/**
 * Test setup file - runs before all tests
 * Sets up environment variables and global mocks
 */

import { expect, vi } from 'vitest';

// Set up environment variables for testing
process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
};
