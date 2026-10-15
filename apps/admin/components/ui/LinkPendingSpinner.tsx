'use client';

/**
 * Drop inside a next/link <Link> to show a spinner while that link's
 * navigation is in flight. Meant for links that stay on the same page and
 * only change search params (e.g. the attendance form tabs): those never
 * show the route's loading.tsx, so without this the click looks ignored
 * until the server finishes rendering.
 */
import { useLinkStatus } from 'next/link';
import Spinner from '@/components/ui/Spinner';

export default function LinkPendingSpinner({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  const { pending } = useLinkStatus();
  return pending ? <Spinner className={className} /> : null;
}
