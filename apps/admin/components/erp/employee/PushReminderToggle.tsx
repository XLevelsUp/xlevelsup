'use client';

/**
 * Turns notifications on or off for this device, under the Time Tracker. It
 * lives there because that's on both pages with a Clock In button, and the
 * attendance page is all a freelancer has.
 */

import { useEffect, useState } from 'react';
import Spinner from '@/components/ui/Spinner';
import { toast } from '@/lib/toast';
import {
  removePushSubscriptionAction,
  savePushSubscriptionAction,
} from '@/actions/erp/push';

type PushState = 'checking' | 'hidden' | 'needs-install' | 'blocked' | 'off' | 'on';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

/** The browser wants the key as bytes; the environment holds it as base64url. */
function keyToBytes(key: string): Uint8Array<ArrayBuffer> {
  const base64 = key.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(key.length / 4) * 4, '=');
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function detectState(): Promise<PushState> {
  if (!VAPID_PUBLIC_KEY) return 'hidden';

  const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  if (!supported) {
    // iPhones only offer push once the site is on the Home Screen.
    return /iphone|ipad|ipod/i.test(navigator.userAgent) ? 'needs-install' : 'hidden';
  }
  if (Notification.permission === 'denied') return 'blocked';

  const registration = await navigator.serviceWorker.getRegistration('/');
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return 'off';

  // Browsers can replace a subscription without notice, so keep the server's copy current.
  void savePushSubscriptionAction(subscription.toJSON());
  return 'on';
}

export default function PushReminderToggle() {
  const [state, setState] = useState<PushState>('checking');
  const [isBusy, setIsBusy] = useState(false);

  useEffect(() => {
    detectState()
      .then(setState)
      .catch((error) => {
        console.warn('Could not read notification state:', error);
        setState('hidden');
      });
  }, []);

  const turnOn = async () => {
    setIsBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'blocked' : 'off');
        return;
      }

      await navigator.serviceWorker.register('/sw.js');
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyToBytes(VAPID_PUBLIC_KEY!),
      });

      const result = await savePushSubscriptionAction(subscription.toJSON());
      if (!result.success) {
        await subscription.unsubscribe();
        toast.error(result.error || 'Could not turn on reminders');
        return;
      }
      setState('on');
      toast.success('Reminders are on for this device');
    } catch (error) {
      console.error('Turning on reminders failed:', error);
      toast.error('Could not turn on reminders');
    } finally {
      setIsBusy(false);
    }
  };

  const turnOff = async () => {
    setIsBusy(true);
    try {
      const registration = await navigator.serviceWorker.getRegistration('/');
      const subscription = await registration?.pushManager.getSubscription();
      if (subscription) {
        await removePushSubscriptionAction(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setState('off');
    } catch (error) {
      console.error('Turning off reminders failed:', error);
      toast.error('Could not turn off reminders');
    } finally {
      setIsBusy(false);
    }
  };

  if (state === 'checking' || state === 'hidden') return null;

  const hint =
    state === 'needs-install'
      ? 'On iPhone, add this site to your Home Screen first, then open it from there to turn on reminders.'
      : state === 'blocked'
        ? 'Notifications are blocked for this site. Allow them in your browser settings to get reminders.'
        : state === 'on'
          ? 'Reminders are on for this device.'
          : 'Get reminded to clock in at 10:30 AM and clock out at 6 PM.';

  return (
    <div className='mt-3 flex items-center justify-between gap-3 text-xs text-gray-400'>
      <p className='min-w-0'>🔔 {hint}</p>
      {(state === 'on' || state === 'off') && (
        <button
          type='button'
          onClick={state === 'on' ? turnOff : turnOn}
          disabled={isBusy}
          className='inline-flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-md border border-gray-700 text-gray-200 hover:border-[var(--cyan)] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
        >
          {isBusy && <Spinner className='h-3 w-3' />}
          {state === 'on' ? 'Turn off' : 'Turn on'}
        </button>
      )}
    </div>
  );
}
