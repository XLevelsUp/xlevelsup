/**
 * Shared prop types for the admin app's primitives in components/ui.
 *
 * The marketing-domain types that used to live here (CardProps, FormData,
 * Testimonial, Service, Client) were dropped in the monorepo split: Card.tsx
 * had no callers anywhere, and the other four had none either. They described
 * the marketing site, so keeping them in the admin app would have been doubly
 * wrong.
 */

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** Overrides the default `max-w-2xl` — e.g. `max-w-7xl` for wide content like an A3 invoice preview. */
  maxWidthClassName?: string;
}
