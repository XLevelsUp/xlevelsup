'use server';

/**
 * Server Actions for turning notifications on and off on a device. The device
 * always goes to the signed-in employee, never to a client-supplied id.
 */

import { z } from 'zod';
import { getEmployeeSession } from '@/lib/erp/employee-portal-auth';
import { deletePushSubscription, isPushEndpoint, savePushSubscription } from '@/lib/erp/push';

const subscriptionSchema = z.object({
  endpoint: z.string().refine(isPushEndpoint, 'Not a push service address'),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
});

export async function savePushSubscriptionAction(
  subscription: unknown,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return { success: false, error: 'Your session has expired. Please log in again.' };
    }

    await savePushSubscription(session.id, subscriptionSchema.parse(subscription));
    return { success: true };
  } catch (error) {
    console.error('Save push subscription error:', error);
    return { success: false, error: 'Could not turn on reminders' };
  }
}

export async function removePushSubscriptionAction(
  endpoint: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getEmployeeSession();
    if (!session) {
      return { success: false, error: 'Your session has expired. Please log in again.' };
    }

    await deletePushSubscription(session.id, endpoint);
    return { success: true };
  } catch (error) {
    console.error('Remove push subscription error:', error);
    return { success: false, error: 'Could not turn off reminders' };
  }
}
