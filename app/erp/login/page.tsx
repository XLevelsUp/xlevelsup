'use client';

import { useFormStatus } from 'react-dom';
import { useState, useEffect, useActionState } from 'react';
import { useRouter } from 'next/navigation';
import { m as motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Button from '@/components/ui/Button';
import { login, type AuthResult } from '@/actions/erp/auth';

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button
      type='submit'
      variant='primary'
      className='w-full'
      disabled={pending}
    >
      {pending ? (
        <span className='flex items-center justify-center gap-2'>
          <svg
            className='animate-spin h-5 w-5'
            xmlns='http://www.w3.org/2000/svg'
            fill='none'
            viewBox='0 0 24 24'
          >
            <circle
              className='opacity-25'
              cx='12'
              cy='12'
              r='10'
              stroke='currentColor'
              strokeWidth='4'
            ></circle>
            <path
              className='opacity-75'
              fill='currentColor'
              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
            ></path>
          </svg>
          Logging in...
        </span>
      ) : (
        'Login'
      )}
    </Button>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [state, formAction] = useActionState(
    async (prevState: AuthResult, formData: FormData) => {
      return await login(formData);
    },
    { success: false },
  );

  // Handle successful login
  useEffect(() => {
    if (state.success && state.redirectTo) {
      toast.success('Login successful!', {
        duration: 2000,
        position: 'top-center',
        style: {
          background: '#0a0a0a',
          color: '#fff',
          border: '1px solid #00ffff',
        },
      });
      router.push(state.redirectTo);
    } else if (state.error) {
      toast.error(state.error, {
        duration: 3000,
        position: 'top-center',
        style: {
          background: '#0a0a0a',
          color: '#fff',
          border: '1px solid #ff0000',
        },
      });
    }
  }, [state, router]);

  return (
    <div className='min-h-screen flex items-center justify-center px-4 py-12'>
      <motion.div
        className='w-full max-w-md'
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className='glass p-8 rounded-2xl'>
          <div className='text-center mb-8'>
            <h1 className='text-4xl font-bold mb-2'>
              <span className='gradient-text'>ERP Login</span>
            </h1>
            <p className='text-gray-400'>
              Sign in to access the internal ERP system
            </p>
          </div>

          <form action={formAction} className='space-y-6'>
            <div>
              <label htmlFor='email' className='block text-sm font-medium mb-2'>
                Email Address
              </label>
              <input
                type='email'
                id='email'
                name='email'
                required
                className='w-full px-4 py-3 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
                placeholder='admin@xlevelsup.com'
              />
            </div>

            <div>
              <label
                htmlFor='password'
                className='block text-sm font-medium mb-2'
              >
                Password
              </label>
              <input
                type='password'
                id='password'
                name='password'
                required
                className='w-full px-4 py-3 rounded-lg bg-dark-800 border border-gray-700 text-white focus:outline-none focus:border-cyan transition-colors'
                placeholder='Enter your password'
              />
            </div>

            <SubmitButton />
          </form>

          <div className='mt-6 p-4 bg-dark-800 rounded-lg'>
            <p className='text-sm text-gray-400 mb-2'>Default credentials:</p>
            <p className='text-xs text-gray-500'>
              Email: admin@xlevelsup.com
              <br />
              Password: admin123
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
