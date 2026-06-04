'use client';

import { m as motion } from 'framer-motion';
import Button from '../ui/Button';
import Link from 'next/link';

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
            <div className="absolute inset-0 bg-linear-to-br from-dark-900 via-dark-800 to-dark-900">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="relative z-10 max-w-5xl mx-auto text-center">
                {/* Eyebrow label */}
                {/* <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 mb-8 px-4 py-2 rounded-full glass border border-cyan/20 text-sm text-cyan font-medium tracking-wider uppercase"
                >
                    <span className="w-2 h-2 rounded-full bg-cyan animate-pulse"></span>
                    End-to-End Technology Partner
                </motion.div> */}

                {/* H1 — NO animation, instant render for LCP */}
                <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                    Your End-to-End Growth Partner —{' '}
                    <span className="gradient-text">From Logo Design to AI Automation</span>
                </h1>

                <motion.p
                    className="text-xl md:text-2xl text-gray-300 mb-4 max-w-3xl mx-auto font-light"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.1 }}
                >
                    Engineering <span className="gradient-text font-semibold">X times</span> more growth.
                </motion.p>

                <motion.p
                    className="text-lg md:text-xl text-gray-400 mb-12 max-w-3xl mx-auto leading-relaxed"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    We build the technology that runs your business—and the marketing engines that scale it.
                    XLEVELSUP is your dedicated partner for custom software, AI automation,
                    and algorithmic customer acquisition. All under one roof. All engineered to compound.
                </motion.p>

                <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                >
                    <Button onClick={scrollToContact} variant="primary">
                        Architect Your Growth
                    </Button>
                    <Link
                        href="/solutions/marketing-architecture"
                        className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-lg glass border border-white/10 text-white font-semibold hover:border-cyan/40 transition-all duration-300 text-lg"
                    >
                        View Our Solutions
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </motion.div>

                {/* Trust metrics */}
                <motion.div
                    className="mt-20 grid grid-cols-3 gap-8 max-w-2xl mx-auto"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <div className="text-center">
                        <div className="text-3xl font-bold gradient-text">X∞</div>
                        <div className="text-sm text-gray-400 mt-1">Scalable Infrastructure</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold gradient-text">100%</div>
                        <div className="text-sm text-gray-400 mt-1">Data-Driven Execution</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold gradient-text">24/7</div>
                        <div className="text-sm text-gray-400 mt-1">Systems Always On</div>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}