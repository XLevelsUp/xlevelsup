'use client';

/**
 * Mounts the toast stack, rendered entirely by our Toast component, and
 * routes the browser's native form-validation bubbles into it so that no
 * browser-default popup ever shows.
 */
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import Toast from '@/components/ui/Toast';
import { toast } from '@/lib/toast';

export default function ToastProvider() {
  useNativeValidationToasts();

  return (
    <Toaster
      position='top-center'
      gutter={10}
      // Above DeleteConfirmButton's portalled popover (z-[9999]).
      containerStyle={{ zIndex: 10000 }}
      toastOptions={{ success: { duration: 3000 }, error: { duration: 5000 } }}
    >
      {(t) => <Toast t={t} />}
    </Toaster>
  );
}

type ValidatableField = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

/**
 * Native constraint validation (`required`, `type='email'`, `min`, …) shows
 * the browser's own tooltip bubble on submit. Cancelling the `invalid` event
 * suppresses that bubble while still blocking the submit, so one listener here
 * covers every form in the app without touching any of them. `invalid` does
 * not bubble, so it has to be caught in the capture phase.
 */
function useNativeValidationToasts() {
  useEffect(() => {
    let reportedThisSubmit = false;

    const handleInvalid = (e: Event) => {
      e.preventDefault();

      // One submit fires `invalid` on every bad field at once. Report the
      // first, as the native bubble does; the rest surface on the next try.
      if (reportedThisSubmit) return;
      reportedThisSubmit = true;
      setTimeout(() => {
        reportedThisSubmit = false;
      }, 0);

      const field = e.target as ValidatableField;
      if (!('validationMessage' in field)) return;

      // With the event cancelled the browser no longer focuses the field
      // itself, so take the user there.
      field.focus({ preventScroll: true });
      field.scrollIntoView({ block: 'center', behavior: 'smooth' });

      const label = fieldLabel(field);
      toast.error(label ? `${label}: ${field.validationMessage}` : field.validationMessage, {
        id: 'form-validation',
      });
    };

    document.addEventListener('invalid', handleInvalid, true);
    return () => document.removeEventListener('invalid', handleInvalid, true);
  }, []);
}

function fieldLabel(field: ValidatableField): string {
  const text = field.labels?.[0]?.textContent ?? field.getAttribute('aria-label') ?? '';
  // Labels carry a trailing required-marker asterisk.
  return text.replace(/\*/g, '').replace(/\s+/g, ' ').trim();
}
