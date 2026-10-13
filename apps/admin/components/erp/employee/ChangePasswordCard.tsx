'use client';

/**
 * Change Password card on the employee's profile page — any employee can
 * change their own portal login password, confirming the current one first.
 * Same rules as the first-login change (8+ characters, upper, lower and a
 * number), and the same ending: signed out, to log in again with the new
 * password.
 */

import { useActionState, useEffect } from 'react';
import { changePasswordAction, employeeLogoutAction } from '@/actions/erp/employee-auth';
import Button from '@/components/ui/Button';
import PasswordField from '@/components/erp/PasswordField';
import { toast } from 'react-hot-toast';

export default function ChangePasswordCard() {
  // On an error React clears the form once the action resolves — fine for
  // password fields, which shouldn't linger anyway.
  const [state, formAction, isPending] = useActionState(changePasswordAction, null);

  useEffect(() => {
    if (state?.success) {
      toast.success('Password changed. Please log in with your new password.');
      // Logout errors don't matter here — the redirect happens either way.
      employeeLogoutAction()
        .catch((error) => console.error('Logout error:', error))
        .finally(() => {
          window.location.href = '/employee/login?passwordChanged=true';
        });
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const value = (name: string) => (form.elements.namedItem(name) as HTMLInputElement).value;
    if (value('newPassword') !== value('confirmPassword')) {
      e.preventDefault();
      toast.error('New passwords do not match');
    }
  };

  return (
    <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6'>
      <h2 className='text-xl font-bold text-white mb-1'>Change Password</h2>
      <p className='text-sm text-gray-400 mb-4'>
        Update the password you use to log in to the employee portal.
      </p>

      <form action={formAction} onSubmit={handleSubmit} className='space-y-4'>
        <PasswordField
          id='currentPassword'
          name='currentPassword'
          label='Current Password'
          placeholder='Your current password'
          autoComplete='current-password'
          disabled={isPending}
        />
        <PasswordField
          id='newPassword'
          name='newPassword'
          label='New Password'
          placeholder='At least 8 characters'
          hint='Must contain uppercase, lowercase, and number'
          disabled={isPending}
        />
        <PasswordField
          id='confirmPassword'
          name='confirmPassword'
          label='Confirm New Password'
          placeholder='Re-enter your new password'
          disabled={isPending}
        />

        <Button type='submit' variant='primary' className='w-full' disabled={isPending}>
          {isPending ? 'Changing Password...' : 'Change Password'}
        </Button>

        <p className='text-xs text-gray-500 text-center'>
          After changing your password, you will be logged out and need to log in again with
          your new password.
        </p>
      </form>
    </div>
  );
}
