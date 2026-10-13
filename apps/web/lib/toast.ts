/**
 * The app's single toast entry point. Components import `toast` from here,
 * never from react-hot-toast directly (enforced by `no-restricted-imports` in
 * eslint.config.mjs).
 *
 * react-hot-toast stays as the queue/timer engine — dedupe by id, pause on
 * hover, stacking — but it never renders its own UI: ToastProvider hands every
 * toast to components/ui/Toast.tsx. This module only adds what the library
 * lacks, a warning tone.
 */
import {
  toast as engine,
  type Renderable,
  type Toast,
  type ToastOptions,
  type ValueOrFunction,
} from 'react-hot-toast';

export type ToastTone = 'success' | 'error' | 'warning' | 'info' | 'loading';

type Message = ValueOrFunction<Renderable, Toast>;

/** react-hot-toast has no warning type, so a warning travels as a blank toast
 * carrying this marker in `className` — a field the renderer reads but never
 * applies as a real class. */
const WARNING_MARKER = 'toast-tone-warning';

export const toast = Object.assign(
  (message: Message, options?: ToastOptions) => engine(message, options),
  {
    success: engine.success,
    error: engine.error,
    loading: engine.loading,
    promise: engine.promise,
    dismiss: engine.dismiss,
    warning: (message: Message, options?: ToastOptions) =>
      engine(message, { ...options, className: WARNING_MARKER }),
  },
);

export function toneOf(t: Toast): ToastTone {
  if (t.type === 'blank' || t.type === 'custom') {
    return t.className === WARNING_MARKER ? 'warning' : 'info';
  }
  return t.type;
}
