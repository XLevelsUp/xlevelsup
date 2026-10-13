'use client';

/**
 * Change-your-own-password form for an admin panel login (admin, HR,
 * accountant) — the `users` account, not the employee-portal password.
 * Shown in the header's account menu dialog, and on the employee profile
 * page for someone who reached the portal through their admin login.
 *
 * Same rules as the employee portal (lib/erp/password-policy.ts), and the
 * same ending: signed out, to log in again with the new password.
 */

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { changeOwnPasswordAction, logout } from '@/actions/erp/auth';
import Button from '@/components/ui/Button';
import PasswordField from './PasswordField';
import { toast } from '@/lib/toast';

export default function ChangeOwnPasswordForm() {
  const router = useRouter();
  // On an error React clears the form once the action resolves — fine for
  // password fields, which shouldn't linger anyway.
  const [state, formAction, isPending] = useActionState(changeOwnPasswordAction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success('Password changed. Please log in with your new password.');
      // Logout errors don't matter here — the redirect happens either way.
      logout()
        .catch((error) => console.error('Logout error:', error))
        .finally(() => router.push('/erp/login'));
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value;
    if (value('newPassword') !== value('confirmPassword')) {
      e.preventDefault();
      toast.error('New passwords do not match');
    }
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className='space-y-4'>
      <PasswordField
        id='admin-currentPassword'
        name='currentPassword'
        label='Current Password'
        placeholder='Your current password'
        autoComplete='current-password'
        disabled={isPending}
      />
      <PasswordField
        id='admin-newPassword'
        name='newPassword'
        label='New Password'
        placeholder='At least 8 characters'
        hint='Must contain uppercase, lowercase, and number'
        disabled={isPending}
      />
      <PasswordField
        id='admin-confirmPassword'
        name='confirmPassword'
        label='Confirm New Password'
        placeholder='Re-enter your new password'
        disabled={isPending}
      />

      <Button type='submit' variant='primary' className='w-full' disabled={isPending || state?.success}>
        {isPending ? 'Changing Password...' : 'Change Password'}
      </Button>

      <p className='text-xs text-gray-500 text-center'>
        After changing your password, you will be logged out and need to log in again with your
        new password.
      </p>
    </form>
  );
}
