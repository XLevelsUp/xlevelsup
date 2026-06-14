/**
 * Authentication utilities for ERP system
 * Uses JWT tokens stored in HTTP-only cookies
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { User, UserRole } from '@/types/erp';

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || 'xlevelsup-erp-secret-key-change-in-production',
);

const COOKIE_NAME = 'erp-session';
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 7, // 7 days
  path: '/',
};

export interface SessionPayload {
  userId: number;
  email: string;
  role: UserRole;
}

/**
 * Create a new session token
 */
export async function createSession(
  user: Pick<User, 'id' | 'email' | 'role'>,
): Promise<string> {
  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    role: user.role,
  } as SessionPayload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET_KEY);

  return token;
}

/**
 * Verify and decode session token
 */
export async function verifySession(
  token: string,
): Promise<SessionPayload | null> {
  try {
    const verified = await jwtVerify(token, SECRET_KEY);
    return verified.payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Get current session from cookies
 */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME);

  if (!token) {
    return null;
  }

  return verifySession(token.value);
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, COOKIE_OPTIONS);
}

/**
 * Delete session cookie
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Require authentication - throws error if not authenticated
 */
export async function requireAuth(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error('Unauthorized - Please login');
  }
  return session;
}

/**
 * Require specific role - throws error if user doesn't have required role
 */
export async function requireRole(
  allowedRoles: UserRole[],
): Promise<SessionPayload> {
  const session = await requireAuth();
  if (!allowedRoles.includes(session.role)) {
    throw new Error('Forbidden - Insufficient permissions');
  }
  return session;
}

/**
 * Check if user has any of the specified roles
 */
export function hasRole(
  session: SessionPayload | null,
  roles: UserRole[],
): boolean {
  if (!session) return false;
  return roles.includes(session.role);
}
