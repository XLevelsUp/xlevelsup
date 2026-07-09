'use client';

import { m as motion } from 'framer-motion';
import EmojiIcon from '@/components/ui/EmojiIcon';

export default function SystemDiagram() {
    const steps = [
        { name: 'Traffic Source', icon: '🎯', description: 'Google Ads, Meta, LinkedIn' },
        { name: 'Landing Page', icon: '🚀', description: 'Custom High-Convert Pages' },
        { name: 'API Event', icon: '⚡', description: 'Server-Side Tracking' },
        { name: 'CRM', icon: '📊', description: 'Lead Nurturing & ROAS' },
    ];

    return (
        <div className="glass p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-8 text-center">
                The <span className="gradient-text">Growth System</span> Flow
            </h3>

            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                {steps.map((step, index) => (
                    <div key={step.name} className="flex items-center gap-4 w-full md:w-auto">
                        {/* Step Card */}
                        <motion.div
                            className="flex-1 md:flex-none"
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.2 }}
                        >
                            <div className="glass p-6 rounded-xl hover:border-cyan transition-all duration-300 min-w-[200px]">
                                <div className="text-4xl mb-3 text-cyan flex justify-center">
                                    <EmojiIcon emoji={step.icon} className="w-10 h-10" />
                                </div>
                                <h4 className="font-bold text-center mb-2 gradient-text">{step.name}</h4>
                                <p className="text-xs text-gray-400 text-center">{step.description}</p>
                            </div>
                        </motion.div>

                        {/* Arrow */}
                        {index < steps.length - 1 && (
                            <motion.div
                                className="hidden md:block"
                                initial={{ opacity: 0, scale: 0 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: index * 0.2 + 0.3 }}
                            >
                                <svg
                                    className="w-8 h-8 text-cyan"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                                </svg>
                            </motion.div>
                        )}

                        {/* Mobile Arrow (Down) */}
                        {index < steps.length - 1 && (
                            <motion.div
                                className="md:hidden"
                                initial={{ opacity: 0, scale: 0 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: index * 0.2 + 0.3 }}
                            >
                                <svg
                                    className="w-8 h-8 text-cyan mx-auto"
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M19 14l-7 7m0 0l-7-7m7 7V3"></path>
                                </svg>
                            </motion.div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-8 p-4 rounded-lg bg-cyan/10 border border-cyan/20">
                <p className="text-sm text-cyan text-center">
                    ⚡ Server-Side Tracking Bypasses iOS Blocks • 📈 Real-Time ROAS Monitoring • 🤖 Automated Lead Nurturing
                </p>
            </div>
        </div>
    );
}
