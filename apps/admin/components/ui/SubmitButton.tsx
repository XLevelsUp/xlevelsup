'use client';

/**
 * Submit button for a `<form action={serverAction}>` rendered by a server
 * component (e.g. the portal's Logout forms), which can't hold pending state
 * itself. useFormStatus reads the enclosing form's submission, so the button
 * spins and locks from the click until the action — and any redirect it
 * issues — has finished.
 */
import { useFormStatus } from 'react-dom';
import Spinner from '@/components/ui/Spinner';

export default function SubmitButton({
  children,
  pendingText,
  className = '',
}: {
  children: React.ReactNode;
  pendingText?: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type='submit'
      disabled={pending}
      aria-busy={pending || undefined}
      className={`inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait ${className}`}
    >
      {pending && <Spinner />}
      {pending ? (pendingText ?? children) : children}
    </button>
  );
}
