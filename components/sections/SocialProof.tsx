'use client';

import { motion } from 'framer-motion';

export default function SocialProof() {
    const clients = [
        'Pratyagara Silks',
        'Wanderingkite Studio',
        'Sakthi Chains',
        'Alusea',
    ];

    // Duplicate for seamless loop
    const duplicatedClients = [...clients, ...clients];

    return (
        <section className="py-16 px-4 bg-dark-800/50">
            <div className="max-w-7xl mx-auto">
                <motion.h3
                    className="text-center text-gray-400 text-sm uppercase tracking-wider mb-8"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                >
                    Trusted by Industry Leaders
                </motion.h3>

                <div className="relative overflow-hidden">
                    <motion.div
                        className="flex gap-16"
                        animate={{
                            x: [0, -50 + '%'],
                        }}
                        transition={{
                            x: {
                                repeat: Infinity,
                                repeatType: 'loop',
                                duration: 20,
                                ease: 'linear',
                            },
                        }}
                    >
                        {duplicatedClients.map((client, index) => (
                            <div
                                key={index}
                                className="flex-shrink-0 text-2xl font-bold text-gray-500 hover:text-white transition-colors duration-300 whitespace-nowrap"
                            >
                                {client}
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
