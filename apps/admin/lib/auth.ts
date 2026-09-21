/**
 * Authentication utilities for ERP system
 * Uses JWT tokens stored in HTTP-only cookies
 */

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
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
  [key: string]: unknown;
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
  } catch {
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

/**
 * The accountant role is invoice-read-only.
 *
 * WHY THIS EXISTS AS A NAMED HELPER: most ERP pages gate access with
 * `if (session.role === 'employee') redirect(...)`. An accountant is not an
 * employee, so every one of those checks would silently admit it — granting a
 * bookkeeper payroll, employee records and the finance ledger. Any page that is
 * not invoice history must therefore deny accountants EXPLICITLY, which is what
 * `assertErpPageAccess` below does.
 */
export function isAccountant(session: SessionPayload | null): boolean {
  return session?.role === 'accountant';
}

/**
 * Roles allowed to reach a general ERP page (anything except invoice history).
 *
 * Deliberately an allow-list. Adding a future role must be a conscious decision
 * at this one site rather than an accident of `!== 'employee'` checks scattered
 * across pages.
 */
export const ERP_FULL_ACCESS_ROLES: UserRole[] = ['admin', 'hr'];

/**
 * Roles permitted to read invoices (view + download).
 * Accountants are read-only here; creating and editing invoices stays with
 * admin/hr via the requireRole guards in actions/erp/billing.ts.
 */
export const INVOICE_READ_ROLES: UserRole[] = ['admin', 'hr', 'accountant'];

/**
 * Roles permitted to READ the Finances area — ledger, company accounts,
 * summaries and receipt files. Accountants get this so they can review the
 * books; every write in that area stays on ERP_FULL_ACCESS_ROLES (or a
 * narrower guard), so this list must only ever be applied to read actions.
 * Payslips are deliberately not covered: they carry per-employee salary
 * detail beyond what the ledger rows show.
 */
export const FINANCE_READ_ROLES: UserRole[] = ['admin', 'hr', 'accountant'];

/**
 * Page-level guard for every ERP screen that is NOT invoice history.
 *
 * Returns the session when the caller may proceed, or a redirect target when
 * it may not. Pages call it instead of hand-rolling `role === 'employee'`,
 * which is what let a new role through by default.
 *
 *   const session = await getSession();
 *   const denied = erpPageRedirect(session);
 *   if (denied) redirect(denied);
 *
 * Accountants are sent to billing history — their only screen — rather than to
 * the dashboard, which would show them an empty shell.
 */
export function erpPageRedirect(
  session: SessionPayload | null,
  options?: { allowAccountant?: boolean },
): string | null {
  if (!session) return '/erp/login';
  // Accountants only. Deliberately does NOT change what employees can reach —
  // several of these pages were already open to them and tightening that here
  // would be an unrelated permissions change.
  //
  // `allowAccountant` exists for the one non-invoice area they may read: the
  // Finances page. It is opt-in per page, so a new page stays denied to
  // accountants by default instead of relying on someone remembering to block it.
  if (session.role === 'accountant' && !options?.allowAccountant) {
    return '/erp/billing?tab=history';
  }
  return null;
}

