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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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
        <div className='relative'>
          <input
            type={showNewPassword ? 'text' : 'password'}
            id='newPassword'
            name='newPassword'
            required
            minLength={8}
            placeholder='At least 8 characters'
            disabled={isChanging}
            className='w-full pl-4 pr-10 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white placeholder-gray-500 disabled:opacity-50'
          />
          <button
            type='button'
            onClick={() => setShowNewPassword(!showNewPassword)}
            className='absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none'
          >
            {showNewPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 hover:text-white transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 hover:text-white transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            )}
          </button>
        </div>
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
        <div className='relative'>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            id='confirmPassword'
            name='confirmPassword'
            required
            minLength={8}
            placeholder='Re-enter your password'
            disabled={isChanging}
            className='w-full pl-4 pr-10 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white placeholder-gray-500 disabled:opacity-50'
          />
          <button
            type='button'
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className='absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none'
          >
            {showConfirmPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 hover:text-white transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 hover:text-white transition-colors">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              </svg>
            )}
          </button>
        </div>
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
