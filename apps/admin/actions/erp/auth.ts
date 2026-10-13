'use server';

import { z } from 'zod';
import { compare, hash } from 'bcryptjs';
import { supabase } from '@/lib/supabase';
import { supabaseServer } from '@/lib/supabase-server';
import {
  createSession,
  getSession,
  setSessionCookie,
  deleteSessionCookie,
} from '@/lib/auth';
import { changePasswordSchema } from '@/lib/erp/password-policy';

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
 * Change the signed-in admin panel user's own login password (any role —
 * admin, HR, accountant). Who is changing it comes from the session, never
 * from the client, and the current password must be confirmed. The caller
 * signs them out afterwards so they log in again with the new password.
 */
export async function changeOwnPasswordAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session) {
      return { success: false, error: 'Your session has expired. Please log in again.' };
    }

    const validated = changePasswordSchema.parse({
      currentPassword: formData.get('currentPassword') as string,
      newPassword: formData.get('newPassword') as string,
      confirmPassword: formData.get('confirmPassword') as string,
    });

    const { data: user, error: fetchError } = await supabaseServer
      .from('users')
      .select('password_hash')
      .eq('id', session.userId)
      .maybeSingle();
    if (fetchError) throw fetchError;
    if (!user) {
      return { success: false, error: 'Your account could not be found. Please log in again.' };
    }

    if (!(await compare(validated.currentPassword, user.password_hash))) {
      return { success: false, error: 'Current password is incorrect' };
    }

    const { error: updateError } = await supabaseServer
      .from('users')
      .update({
        password_hash: await hash(validated.newPassword, 10),
        updated_at: new Date().toISOString(),
      })
      .eq('id', session.userId);
    if (updateError) throw updateError;

    return { success: true };
  } catch (error) {
    console.error('Change own password error:', error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.issues[0].message };
    }
    return { success: false, error: 'Failed to change password' };
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
