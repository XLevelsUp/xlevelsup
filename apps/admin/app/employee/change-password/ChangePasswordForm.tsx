'use client';

/**
 * Change Password Form Component
 * Client component for handling password change with logout redirect
 */

import { useActionState, useEffect, useState } from 'react';
import {
  forceChangePasswordAction,
  employeeLogoutAction,
} from '@/actions/erp/employee-auth';
import Button from '@/components/ui/Button';
import PasswordField from '@/components/erp/PasswordField';
import { toast } from 'react-hot-toast';

interface ChangePasswordFormProps {
  employeeName: string;
}

export default function ChangePasswordForm({ employeeName }: ChangePasswordFormProps) {
  const [isChanging, setIsChanging] = useState(false);

  // The action works out who is changing their password from the session —
  // nothing identifying is sent from here.
  const [state, formAction] = useActionState(forceChangePasswordAction, null);

  useEffect(() => {
    if (state?.success) {
      // Password changed successfully
      toast.success('Password changed successfully!');

      // Logout and redirect to login
      const handleLogoutAndRedirect = async () => {
        try {
          await employeeLogoutAction();
          // Redirect with success message in URL
          window.location.href = '/employee/login?passwordChanged=true';
        } catch (error) {
          console.error('Logout error:', error);
          // Force redirect anyway
          window.location.href = '/employee/login?passwordChanged=true';
        }
      };

      handleLogoutAndRedirect();
    } else if (state?.error) {
      toast.error(state.error);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- clears the submitting flag once the server action reports failure. Deriving it from useFormStatus instead would mean restructuring the submit path; the toast beside it is an external side effect that belongs in an effect regardless.
      setIsChanging(false);
    }
  }, [state]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const form = e.currentTarget;
    const newPassword = (
      form.elements.namedItem('newPassword') as HTMLInputElement
    ).value;
    const confirmPassword = (
      form.elements.namedItem('confirmPassword') as HTMLInputElement
    ).value;

    if (newPassword !== confirmPassword) {
      e.preventDefault();
      toast.error('Passwords do not match');
      return;
    }

    setIsChanging(true);
  };

  return (
    <form action={formAction} onSubmit={handleSubmit} className='space-y-4'>
      {/* Welcome Message */}
      <div className='mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg'>
        <p className='text-sm text-yellow-300'>
          Welcome, <strong>{employeeName}</strong>! For security reasons, please
          change your password before continuing.
        </p>
      </div>

      <PasswordField
        id='newPassword'
        name='newPassword'
        label='New Password'
        placeholder='At least 8 characters'
        hint='Must contain uppercase, lowercase, and number'
        disabled={isChanging}
      />

      <PasswordField
        id='confirmPassword'
        name='confirmPassword'
        label='Confirm Password'
        placeholder='Re-enter your password'
        disabled={isChanging}
      />

      {/* Submit Button */}
      <Button
        type='submit'
        variant='primary'
        className='w-full'
        disabled={isChanging}
      >
        {isChanging ? 'Changing Password...' : 'Change Password'}
      </Button>

      {/* Info */}
      <p className='text-xs text-gray-500 text-center mt-4'>
        After changing your password, you will be logged out and need to log in
        again with your new password.
      </p>
    </form>
  );
}
