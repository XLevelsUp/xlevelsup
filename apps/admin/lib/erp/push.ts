/**
 * Web push: the devices that turned notifications on, and sending to them.
 *
 * A subscription belongs to an employee record, so an admin's devices are
 * reached through the employee record linked to their login. Sending reports
 * what happened rather than throwing — a notification must never be able to
 * fail the action that triggered it.
 */

import webpush from 'web-push';
import { supabaseServer as supabase } from '@/lib/supabase-server';

export interface PushMessage {
  title: string;
  body: string;
  /** Opened when the notification is tapped. */
  url: string;
  /** A second message with the same tag replaces the first instead of stacking. */
  tag: string;
}

export interface PushSubscriptionInput {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface PushSendResult {
  sent: number;
  /** Devices the push service says are gone (uninstalled, turned off). */
  removed: number;
  failed: number;
}

/** A contact address for the push services, required by the VAPID standard. */
const VAPID_SUBJECT = 'https://admin.xlevelsup.com';

/** How long a push service keeps trying: a reminder hours late is worse than none. */
const TTL_SECONDS = 60 * 60;

/** The browser vendors' push services. Sending POSTs to the stored endpoint, and
 * that endpoint comes from the browser, so it must not be able to point anywhere else. */
const PUSH_HOSTS = [
  /^fcm\.googleapis\.com$/,
  /(^|\.)push\.services\.mozilla\.com$/,
  /(^|\.)notify\.windows\.com$/,
  /(^|\.)push\.apple\.com$/,
];

export function isPushEndpoint(endpoint: string): boolean {
  try {
    const { protocol, hostname } = new URL(endpoint);
    return protocol === 'https:' && PUSH_HOSTS.some((host) => host.test(hostname));
  } catch {
    return false;
  }
}

/** Save this device for an employee. A device that changes hands moves to the new owner. */
export async function savePushSubscription(
  employeeId: number,
  subscription: PushSubscriptionInput,
): Promise<void> {
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      employee_id: employeeId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'endpoint' },
  );
  if (error) throw error;
}

export async function deletePushSubscription(employeeId: number, endpoint: string): Promise<void> {
  const { error } = await supabase
    .from('push_subscriptions')
    .delete()
    .eq('employee_id', employeeId)
    .eq('endpoint', endpoint);
  if (error) throw error;
}

/** Send one message to every device these employees turned notifications on for. */
export async function sendPushToEmployees(
  employeeIds: number[],
  message: PushMessage,
): Promise<PushSendResult> {
  const result: PushSendResult = { sent: 0, removed: 0, failed: 0 };
  if (employeeIds.length === 0) return result;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    console.error('Push skipped: VAPID keys are not set');
    return result;
  }

  const { data: devices, error } = await supabase
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('employee_id', employeeIds);
  if (error) {
    console.error('Push skipped: could not load subscriptions:', error);
    return result;
  }

  const payload = JSON.stringify(message);
  await Promise.all(
    (devices || []).map(async (device) => {
      try {
        await webpush.sendNotification(
          { endpoint: device.endpoint, keys: { p256dh: device.p256dh, auth: device.auth } },
          payload,
          {
            TTL: TTL_SECONDS,
            urgency: 'high',
            vapidDetails: { subject: VAPID_SUBJECT, publicKey, privateKey },
          },
        );
        result.sent++;
      } catch (sendError) {
        const status = (sendError as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          await supabase.from('push_subscriptions').delete().eq('id', device.id);
          result.removed++;
        } else {
          console.error('Push failed:', sendError);
          result.failed++;
        }
      }
    }),
  );

  return result;
}
