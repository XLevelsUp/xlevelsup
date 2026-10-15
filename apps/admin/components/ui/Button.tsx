'use client';

import { m as motion } from 'framer-motion';
import { ButtonProps } from '@/types';
import Spinner from '@/components/ui/Spinner';

export default function Button({
    children,
    onClick,
    variant = 'primary',
    type = 'button',
    className = '',
    disabled = false,
    loading = false,
    loadingText,
}: ButtonProps) {
    const baseStyles = 'px-8 py-4 cursor-pointer rounded-lg font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        primary: 'bg-gradient-to-r from-cyan to-purple text-white hover:shadow-lg hover:shadow-purple/50',
        secondary: 'glass text-white hover:border-cyan outline outline-[#00f0ff] shadow-sm shadow-[#b026ff] hover:shadow-[#00f0ff] hover:outline-[#b026ff]',
    };

    // A loading button is also a disabled one, so a second click can't fire
    // the same job twice while the first is still running.
    const isDisabled = disabled || loading;

    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={isDisabled}
            aria-busy={loading || undefined}
            className={`${baseStyles} ${variantStyles[variant]} ${loading ? '!cursor-wait' : ''} ${className}`}
            whileHover={{ scale: isDisabled ? 1 : 1.05 }}
            whileTap={{ scale: isDisabled ? 1 : 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
            {loading ? (
                <span className='inline-flex items-center justify-center gap-2'>
                    <Spinner className='h-5 w-5' />
                    {loadingText ?? children}
                </span>
            ) : (
                children
            )}
        </motion.button>
    );
}
