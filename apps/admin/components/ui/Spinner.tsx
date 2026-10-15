/**
 * Inline busy indicator — the same ring the loading toast uses, so every
 * "working on it" signal in the app looks alike. Inherits the text colour;
 * size it with `className` (h-/w- utilities).
 */
export default function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={`${className} animate-spin shrink-0`} viewBox='0 0 24 24' fill='none' aria-hidden='true'>
      <circle cx='12' cy='12' r='9' stroke='currentColor' strokeOpacity='0.25' strokeWidth='2.5' />
      <path d='M21 12a9 9 0 0 0-9-9' stroke='currentColor' strokeWidth='2.5' strokeLinecap='round' />
    </svg>
  );
}
