'use client';

/**
 * Change Password Form Component
 * Client component for handling password change with logout redirect
 */

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  forceChangePasswordAction,
  employeeLogoutAction,
} from '@/actions/erp/employee-auth';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

interface ChangePasswordFormProps {
  employeeId: number;
  employeeName: string;
}

export default function ChangePasswordForm({
  employeeId,
  employeeName,
}: ChangePasswordFormProps) {
  const router = useRouter();
  const [isChanging, setIsChanging] = useState(false);

  // Bind the action with employeeId - use a wrapper function
  const handleFormAction = async (prevState: any, formData: FormData) => {
    return await forceChangePasswordAction(employeeId, prevState, formData);
  };

  const [state, formAction] = useActionState(handleFormAction, null);

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

      {/* New Password */}
      <div>
        <label
          htmlFor='newPassword'
          className='block text-sm font-medium mb-2 text-gray-300'
        >
          New Password <span className='text-red-500'>*</span>
        </label>
        <input
          type='password'
          id='newPassword'
          name='newPassword'
          required
          minLength={8}
          placeholder='At least 8 characters'
          disabled={isChanging}
          className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white placeholder-gray-500 disabled:opacity-50'
        />
        <p className='text-xs text-gray-500 mt-1'>
          Must contain uppercase, lowercase, and number
        </p>
      </div>

      {/* Confirm Password */}
      <div>
        <label
          htmlFor='confirmPassword'
          className='block text-sm font-medium mb-2 text-gray-300'
        >
          Confirm Password <span className='text-red-500'>*</span>
        </label>
        <input
          type='password'
          id='confirmPassword'
          name='confirmPassword'
          required
          minLength={8}
          placeholder='Re-enter your password'
          disabled={isChanging}
          className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white placeholder-gray-500 disabled:opacity-50'
        />
      </div>

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
