'use client';

import { motion } from 'framer-motion';
import Button from '../ui/Button';

export default function Hero() {
    const scrollToContact = () => {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <section className="min-h-screen flex items-center justify-center relative overflow-hidden px-4">
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto text-center">
                <motion.h1
                    className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    Engineering <span className="gradient-text">X Times</span> More Growth.
                </motion.h1>

                <motion.p
                    className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                >
                    We build high-performance marketing websites and scalable eCommerce applications, then drive measurable results with data-driven ad campaigns.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                >
                    <Button onClick={scrollToContact} variant="primary">
                        Get Your Growth Audit
                    </Button>
                </motion.div>

                {/* Decorative elements */}
                <motion.div
                    className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                >
                    <div className="text-center">
                        <div className="text-3xl font-bold gradient-text">X∞</div>
                        <div className="text-sm text-gray-400 mt-1">Unlimited Growth</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold gradient-text">100%</div>
                        <div className="text-sm text-gray-400 mt-1">Data-Driven</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold gradient-text">24/7</div>
                        <div className="text-sm text-gray-400 mt-1">Engineering Support</div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
