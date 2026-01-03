'use client';

import { motion } from 'framer-motion';
import { CardProps } from '@/types';

export default function Card({ title, description, icon, className = '' }: CardProps) {
    return (
        <motion.div
            className={`glass p-8 rounded-xl hover:border-cyan transition-all duration-300 group ${className}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            whileHover={{ y: -10 }}
        >
            {icon && (
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    {icon}
                </div>
            )}
            <h3 className="text-2xl font-bold mb-4 gradient-text">{title}</h3>
            <p className="text-gray-300 leading-relaxed">{description}</p>
        </motion.div>
    );
}
