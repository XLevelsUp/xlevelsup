'use client';

/**
 * Employee Portal Login Page
 */

import { useActionState, useEffect, Suspense, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { employeeLoginAction } from '@/actions/erp/employee-auth';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { getCurrentPosition } from '@/lib/utils/geolocation';

function EmployeeLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, formAction, isPending] = useActionState(
    employeeLoginAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const [isCapturingLocation, setIsCapturingLocation] = useState(false);

  // Check for password change success message
  useEffect(() => {
    const passwordChanged = searchParams.get('passwordChanged');
    if (passwordChanged === 'true') {
      toast.success(
        'Password changed successfully! Please login with your new password.',
      );
      // Clean up URL
      router.replace('/employee/login');
    }
  }, [searchParams, router]);

  useEffect(() => {
    if (state?.success) {
      toast.success('Login successful!');
      if (state.requirePasswordChange) {
        router.push('/employee/change-password');
      } else {
        router.push('/employee/dashboard');
      }
    } else if (state?.error) {
      toast.error(state.error);
    }
  }, [state, router]);

  // Handle form submission with location capture
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formRef.current) return;

    setIsCapturingLocation(true);

    // Try to get location
    try {
      const position = await getCurrentPosition();

      // Add location to form data via hidden inputs
      const latInput = document.createElement('input');
      latInput.type = 'hidden';
      latInput.name = 'latitude';
      latInput.value = position.latitude.toString();
      formRef.current.appendChild(latInput);

      const lonInput = document.createElement('input');
      lonInput.type = 'hidden';
      lonInput.name = 'longitude';
      lonInput.value = position.longitude.toString();
      formRef.current.appendChild(lonInput);

      const accInput = document.createElement('input');
      accInput.type = 'hidden';
      accInput.name = 'accuracy';
      accInput.value = position.accuracy.toString();
      formRef.current.appendChild(accInput);

      toast.success('Location captured', { duration: 1000 });
    } catch (error) {
      // Location failed, continue without it
      console.warn('Location capture failed:', error);
      toast('Location unavailable - continuing without location', {
        icon: '⚠️',
        duration: 2000,
      });
    } finally {
      setIsCapturingLocation(false);
    }

    // Submit the form
    const formData = new FormData(formRef.current);
    formAction(formData);
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] p-4'>
      <div className='w-full max-w-md'>
        {/* Header */}
        <div className='text-center mb-8'>
          <h1 className='text-3xl font-bold bg-gradient-to-r from-[var(--cyan)] to-[var(--purple)] bg-clip-text text-transparent mb-2'>
            Employee Portal
          </h1>
          <p className='text-gray-400'>XLEVELSUP ERP System</p>
        </div>

        {/* Login Form */}
        <div className='bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-xl'>
          <form action={formAction} className='space-y-4'>
            {/* Email */}
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium mb-2 text-gray-300'
              >
                Email Address
              </label>
              <input
                type='email'
                id='email'
                name='email'
                required
                placeholder='you@example.com'
                disabled={isPending}
                className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white placeholder-gray-500'
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium mb-2 text-gray-300'
              >
                Password
              </label>
              <input
                type='password'
                id='password'
                name='password'
                required
                placeholder='••••••••'
                disabled={isPending}
                className='w-full px-4 py-2 bg-[#0a0a0a] border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--cyan)] text-white placeholder-gray-500'
              />
            </div>

            {/* Default Password Info */}
            <div className='bg-blue-900/20 border border-blue-700/30 rounded-lg p-3'>
              <p className='text-xs text-blue-300'>
                <strong>First time login?</strong> Use your default password:{' '}
                <code className='bg-blue-800/30 px-1 rounded'>
                  Welcome@[YourEmployeeID]
                </code>
                <br />
                Example:{' '}
                <code className='bg-blue-800/30 px-1 rounded'>
                  Welcome@XLU001
                </code>{' '}
                or{' '}
                <code className='bg-blue-800/30 px-1 rounded'>
                  Welcome@TEMP-XLU-001
                </code>
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type='submit'
              variant='primary'
              className='w-full'
              disabled={isPending || isCapturingLocation}
            >
              {isCapturingLocation
                ? 'Capturing location...'
                : isPending
                  ? 'Logging in...'
                  : 'Login'}
            </Button>
          </form>

          {/* Admin Login Link */}
          <div className='mt-6 text-center'>
            <a
              href='/erp/login'
              className='text-sm text-gray-400 hover:text-[var(--cyan)] transition-colors'
            >
              Admin Login →
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className='mt-6 text-center text-xs text-gray-500'>
          <p>Need help? Contact your HR department</p>
        </div>
      </div>
    </div>
  );
}

export default function EmployeeLoginPage() {
  return (
    <Suspense
      fallback={
        <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a]'>
          <div className='text-white'>Loading...</div>
        </div>
      }
    >
      <EmployeeLoginForm />
    </Suspense>
  );
}
