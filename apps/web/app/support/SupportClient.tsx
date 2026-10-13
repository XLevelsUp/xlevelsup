'use client';

// Animation-only client leaves; the /support page itself stays a server component.

import { m as motion, useReducedMotion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { springDefault } from '@/components/marketing/motion';
import type { ReactNode } from 'react';

const ConstellationField = dynamic(
    () => import('@/components/marketing/ConstellationField'),
    { ssr: false },
);

/** Decorative starfield for the hero. Never rendered under reduced motion. */
export function HeroField() {
    const reduced = useReducedMotion();
    if (reduced) return null;
    return (
        <ConstellationField className='pointer-events-none absolute inset-0 h-full w-full' />
    );
}

// Entrance reveal. Uses `animate`, not `whileInView`, so above-the-fold content never waits on an observer.
export function Reveal({
    children,
    className,
    delay = 0,
}: {
    children: ReactNode;
    className?: string;
    delay?: number;
}) {
    const reduced = useReducedMotion();

    return (
        <motion.div
            initial={reduced ? { opacity: 0 } : { opacity: 0, y: 20 }}
            animate={reduced ? { opacity: 1 } : { opacity: 1, y: 0 }}
            transition={
                reduced
                    ? { duration: 0.25, delay }
                    : { ...springDefault, delay }
            }
            className={className}
        >
            {children}
        </motion.div>
    );
}

/** Live-status pulse dot. The ping ring is dropped under reduced motion. */
export function PulseDot() {
    const reduced = useReducedMotion();

    return (
        <span className='relative flex h-1.5 w-1.5' aria-hidden>
            {!reduced && (
                <span
                    className='absolute inline-flex h-full w-full animate-ping rounded-full opacity-70'
                    style={{ background: 'var(--xlu-brand-1)' }}
                />
            )}
            <span
                className='relative inline-flex h-1.5 w-1.5 rounded-full'
                style={{ background: 'var(--xlu-brand-1)' }}
            />
        </span>
    );
}
