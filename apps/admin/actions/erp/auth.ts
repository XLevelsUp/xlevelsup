'use server';

import { z } from 'zod';
import { compare } from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import {
  createSession,
  setSessionCookie,
  deleteSessionCookie,
} from '@/lib/auth';
import type { User } from '@/types/erp';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export interface AuthResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

/**
 * Login action
 */
export async function login(formData: FormData): Promise<AuthResult> {
  try {
    const rawData = {
      email: formData.get('email') as string,
      password: formData.get('password') as string,
    };

    const validatedData = loginSchema.parse(rawData);

    // Get user from database
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', validatedData.email)
      .single();

    if (error || !user) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Verify password
    const isPasswordValid = await compare(
      validatedData.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      return { success: false, error: 'Invalid email or password' };
    }

    // Create session
    const token = await createSession({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    await setSessionCookie(token);

    return {
      success: true,
      redirectTo: '/erp/dashboard',
    };
  } catch (error) {
    console.error('Login error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'An error occurred during login' };
  }
}

/**
 * Logout action
 */
export async function logout(): Promise<AuthResult> {
  try {
    await deleteSessionCookie();
    return { success: true, redirectTo: '/erp/login' };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: 'An error occurred during logout' };
  }
}
