/**
 * Shown the moment someone navigates between employee-portal pages
 * (dashboard quick actions, "Back to Dashboard", post-login redirect) while
 * the next page's server data loads. Without it the old page sat frozen until
 * the new one was fully rendered, so clicks looked like they did nothing.
 *
 * The employee layout (celebration banners) stays mounted above this.
 */
import Spinner from '@/components/ui/Spinner';

export default function EmployeePortalLoading() {
  return (
    <div
      role='status'
      aria-live='polite'
      className='min-h-screen bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] flex flex-col items-center justify-center gap-3 text-[var(--cyan)]'
    >
      <Spinner className='h-8 w-8' />
      <p className='text-sm text-gray-400'>Loading…</p>
    </div>
  );
}
