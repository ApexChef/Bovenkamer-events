/**
 * File: src/lib/auth/jwt.ts
 * Purpose: JWT token creation and verification for session management
 *
 * Key Features:
 * - JWT token generation with user claims
 * - Token verification and expiration checking
 * - httpOnly cookie management
 * - Secure token signing with HS256
 *
 * Security:
 * - Tokens stored in httpOnly cookies (XSS protection)
 * - 30-day expiration matching localStorage cache
 * - Signed with secret key from environment
 */

import { SignJWT, jwtVerify } from 'jose';
import { NextResponse } from 'next/server';

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const TOKEN_EXPIRATION = '30d'; // Match localStorage cache duration
const COOKIE_NAME = 'bovenkamer_auth_token';

// Convert secret to Uint8Array for jose
const secret = new TextEncoder().encode(JWT_SECRET);

/**
 * User claims stored in JWT payload
 */
export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  role: 'participant' | 'admin' | 'quizmaster';
  registrationStatus: 'pending' | 'approved' | 'rejected' | 'cancelled';
  emailVerified: boolean;
  iat?: number; // Issued at
  exp?: number; // Expiration
}

/**
 * Creates a JWT token for a user
 * @param payload - User claims to encode
 * @returns Signed JWT token string
 */
export async function createToken(payload: JWTPayload): Promise<string> {
  try {
    const token = await new SignJWT({
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      registrationStatus: payload.registrationStatus,
      emailVerified: payload.emailVerified,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(TOKEN_EXPIRATION)
      .sign(secret);

    return token;
  } catch (error) {
    console.error('Error creating JWT token:', error);
    throw new Error('Token creation failed');
  }
}

/**
 * Verifies and decodes a JWT token
 * @param token - JWT token string
 * @returns Decoded payload or null if invalid
 */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, secret);

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as 'participant' | 'admin' | 'quizmaster',
      registrationStatus: payload.registrationStatus as
        | 'pending'
        | 'approved'
        | 'rejected'
        | 'cancelled',
      emailVerified: payload.emailVerified as boolean,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    // Token invalid or expired
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Sets JWT token as httpOnly cookie in response
 * @param response - NextResponse to set cookie on
 * @param token - JWT token string
 * @returns Modified response with cookie set
 */
export function setTokenCookie(response: NextResponse, token: string): NextResponse {
  const maxAge = 30 * 24 * 60 * 60; // 30 days in seconds

  response.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: maxAge,
    path: '/',
  });

  return response;
}

/**
 * Clears JWT token cookie (for logout)
 * @param response - NextResponse to clear cookie from
 * @returns Modified response with cookie cleared
 */
export function clearTokenCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: COOKIE_NAME,
    value: '',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}

/**
 * Extracts JWT token from request cookies
 * @param cookies - Request cookies
 * @returns JWT token string or null
 */
export function getTokenFromCookies(cookies: { get: (name: string) => any }): string | null {
  const cookie = cookies.get(COOKIE_NAME);
  return cookie?.value || null;
}

/**
 * Extracts and verifies JWT from request
 * @param request - Request object with cookies
 * @returns Decoded payload or null if invalid
 */
export async function getUserFromRequest(request: {
  cookies: { get: (name: string) => any };
}): Promise<JWTPayload | null> {
  const token = getTokenFromCookies(request.cookies);

  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Checks if user has required role
 * @param payload - JWT payload
 * @param requiredRole - Required role(s)
 * @returns true if user has required role
 */
export function hasRole(
  payload: JWTPayload | null,
  requiredRole: 'participant' | 'admin' | 'quizmaster' | Array<'participant' | 'admin' | 'quizmaster'>
): boolean {
  if (!payload) {
    return false;
  }

  if (Array.isArray(requiredRole)) {
    return requiredRole.includes(payload.role);
  }

  return payload.role === requiredRole;
}

/**
 * Checks if user is admin
 * @param payload - JWT payload
 * @returns true if user is admin
 */
export function isAdmin(payload: JWTPayload | null): boolean {
  return hasRole(payload, 'admin');
}

/**
 * Checks if user registration is approved
 * @param payload - JWT payload
 * @returns true if registration approved
 */
export function isApproved(payload: JWTPayload | null): boolean {
  return payload?.registrationStatus === 'approved';
}

/**
 * Checks if user email is verified
 * @param payload - JWT payload
 * @returns true if email verified
 */
export function isEmailVerified(payload: JWTPayload | null): boolean {
  return payload?.emailVerified === true;
}

/**
 * Gets remaining token validity time
 * @param payload - JWT payload
 * @returns Seconds until expiration, or null if no expiration
 */
export function getTokenExpiryTime(payload: JWTPayload | null): number | null {
  if (!payload?.exp) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const remaining = payload.exp - now;

  return remaining > 0 ? remaining : 0;
}
