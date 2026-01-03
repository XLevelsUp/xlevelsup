'use client';

import { motion } from 'framer-motion';
import { ButtonProps } from '@/types';

export default function Button({
    children,
    onClick,
    variant = 'primary',
    type = 'button',
    className = '',
    disabled = false,
}: ButtonProps) {
    const baseStyles = 'px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        primary: 'bg-gradient-to-r from-cyan to-purple text-white hover:shadow-lg hover:shadow-purple/50',
        secondary: 'glass text-white hover:border-cyan',
    };

    return (
        <motion.button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseStyles} ${variantStyles[variant]} ${className}`}
            whileHover={{ scale: disabled ? 1 : 1.05 }}
            whileTap={{ scale: disabled ? 1 : 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
        >
            {children}
        </motion.button>
    );
}
