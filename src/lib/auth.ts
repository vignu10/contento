/**
 * Shared authentication utilities.
 * Single source of truth for JWT verification and user extraction.
 */

import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { config } from './config';
import { hash, compare } from 'bcryptjs';

export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

/**
 * Extract and verify user ID from request cookies.
 * Returns null if token is missing or invalid.
 */
export function getUserId(request: NextRequest): string | null {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  try {
    const decoded = verify(token, config.jwtSecret) as JwtPayload;
    return decoded.userId;
  } catch {
    return null;
  }
}

/**
 * Extract and verify full JWT payload from request cookies.
 * Returns null if token is missing or invalid.
 */
export function getJwtPayload(request: NextRequest): JwtPayload | null {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;

  try {
    return verify(token, config.jwtSecret) as JwtPayload;
  } catch {
    return null;
  }
}

/**
 * Check if request has valid authentication.
 */
export function isAuthenticated(request: NextRequest): boolean {
  return getUserId(request) !== null;
}

/**
 * Hash a password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return hash(password, 10);
}

/**
 * Verify a password against a hash.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return compare(password, hash);
}
