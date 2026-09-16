/**
 * Builds absolute URLs into the admin app (ERP + employee portal).
 *
 * Since the monorepo split these live on a different origin
 * (admin.xlevelsup.com), so they can no longer be reached with next/link —
 * a client-side navigation would 404 against the marketing server. Every
 * marketing → admin link has to be a plain anchor with an absolute href.
 *
 * NEXT_PUBLIC_ so it is inlined into the client bundle for use in components
 * like the Footer.
 */
const ADMIN_URL = (
  process.env.NEXT_PUBLIC_ADMIN_URL ?? 'https://admin.xlevelsup.com'
).replace(/\/$/, '');

export function adminUrl(path: string): string {
  return `${ADMIN_URL}${path.startsWith('/') ? path : `/${path}`}`;
}
