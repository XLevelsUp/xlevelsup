'use client';

import { m as motion } from 'framer-motion';

/**
 * Legacy marketing button, styled with the pre-XLU --cyan/--purple tokens.
 *
 * This is a deliberate fork of apps/admin/components/ui/Button.tsx rather than
 * a shared package. The two copies are on diverging paths: the marketing site
 * is migrating its CTAs to XluButton on the --xlu-* system (see
 * components/marketing/XluButton.tsx), while the ERP keeps the legacy look.
 * Sharing them would freeze that migration in place.
 *
 * Remaining callers here: ContactForm, Navbar, LeadMagnetPopup.
 */
export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  disabled?: boolean;
}

export default function Button({
    children,
    onClick,
    variant = 'primary',
    type = 'button',
    className = '',
    disabled = false,
}: ButtonProps) {
    const baseStyles = 'px-8 py-4 cursor-pointer rounded-lg font-semibold text-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        primary: 'bg-gradient-to-r from-cyan to-purple text-white hover:shadow-lg hover:shadow-purple/50',
        secondary: 'glass text-white hover:border-cyan outline outline-[#00f0ff] shadow-sm shadow-[#b026ff] hover:shadow-[#00f0ff] hover:outline-[#b026ff]',
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
