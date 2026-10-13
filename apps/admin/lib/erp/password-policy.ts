/**
 * The password rules for a self-service password change — shared by the
 * employee portal (actions/erp/employee-auth.ts) and the admin panel
 * (actions/erp/auth.ts), so the two can't drift apart.
 */

import { z } from 'zod';

export const newPasswordSchema = z
  .string()
  .min(8, 'New password must be at least 8 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    'Password must contain uppercase, lowercase, and number',
  );

/** Current password, new password and its confirmation. */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: newPasswordSchema,
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.newPassword !== data.currentPassword, {
    message: 'New password must be different from your current password',
    path: ['newPassword'],
  });
