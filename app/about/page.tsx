'use client';

import { m as motion } from 'framer-motion';
import AnimatedCounter from '@/components/ui/AnimatedCounter';



export default function AboutPage() {
    return (
        <main className="min-h-screen py-24 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Hero */}
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        The Marketing <span className="gradient-text">Engineering</span> Philosophy
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Where coding logic meets creative marketing. We don't just build—we engineer growth systems.
                    </p>
                </motion.div>

                {/* Story Section */}
                <motion.div
                    className="grid md:grid-cols-2 gap-12 items-center mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <div>
                        <h2 className="text-3xl font-bold mb-6">
                            Engineering <span className="gradient-text">Meets</span> Marketing
                        </h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            XLEVELSUP was born from a simple observation: most marketing agencies treat technology as a tool, not a foundation. We flipped that model.
                        </p>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            Our team doesn't just understand marketing—we understand code, architecture, databases, APIs, and performance optimization. We analyze your existing workflows, identify bottlenecks, and engineer solutions that scale.
                        </p>
                        <p className="text-gray-300 leading-relaxed">
                            Every website we build is optimized for speed. Every campaign we run is backed by data. Every solution we deliver is engineered for measurable, long-term growth.
                        </p>
                    </div>

                    <div className="glass p-12 rounded-2xl relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 to-purple/10"></div>
                        <div className="relative z-10">
                            <div className="text-6xl mb-6">⚡</div>
                            <h3 className="text-2xl font-bold mb-4">Our Approach</h3>
                            <ul className="space-y-3 text-gray-300">
                                <li className="flex items-start gap-3">
                                    <span className="text-cyan mt-1">→</span>
                                    <span>Audit existing systems and workflows</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-cyan mt-1">→</span>
                                    <span>Engineer high-performance solutions</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-cyan mt-1">→</span>
                                    <span>Optimize for speed and scalability</span>
                                </li>
                                <li className="flex items-start gap-3">
                                    <span className="text-cyan mt-1">→</span>
                                    <span>Measure, analyze, and iterate</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </motion.div>

                {/* Stats Counter */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <h2 className="text-3xl font-bold text-center mb-12">
                        By The <span className="gradient-text">Numbers</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="glass p-8 rounded-xl text-center">
                            <div className="text-5xl font-bold gradient-text mb-2">
                                <AnimatedCounter end={100} suffix="%" />
                            </div>
                            <div className="text-gray-400">Code-Based Solutions</div>
                        </div>
                        <div className="glass p-8 rounded-xl text-center">
                            <div className="text-5xl font-bold gradient-text mb-2">
                                <AnimatedCounter end={4} suffix="+" />
                            </div>
                            <div className="text-gray-400">Active Partners</div>
                        </div>
                        <div className="glass p-8 rounded-xl text-center">
                            <div className="text-5xl font-bold gradient-text mb-2">
                                <AnimatedCounter end={95} suffix="+" />
                            </div>
                            <div className="text-gray-400">Lighthouse Scores</div>
                        </div>
                    </div>
                </motion.div>

                {/* Founder Note */}
                <motion.div
                    className="max-w-4xl mx-auto mb-20"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="glass p-12 rounded-2xl">
                        <h2 className="text-3xl font-bold mb-6">
                            The <span className="gradient-text">Vision</span>
                        </h2>
                        <p className="text-gray-300 leading-relaxed mb-4">
                            "We started XLEVELSUP with a mission: to prove that marketing doesn't have to be guesswork. When you combine engineering principles with creative strategy, you get something powerful—predictable, scalable growth."
                        </p>
                        <p className="text-gray-300 leading-relaxed mb-6">
                            "Every line of code we write, every campaign we launch, every system we build is designed with one goal: to increase your business reach X times more. That's not just a tagline—it's our engineering mandate."
                        </p>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan to-purple flex items-center justify-center text-2xl font-bold">
                                X
                            </div>
                            <div>
                                <div className="font-bold">XLEVELSUP Team</div>
                                <div className="text-sm text-gray-400">Engineering Your Growth</div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Mission Card */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <div className="glass p-12 rounded-2xl max-w-3xl mx-auto relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-purple/5"></div>
                        <div className="relative z-10">
                            <h2 className="text-4xl font-bold mb-6">
                                Our <span className="gradient-text">Mission</span>
                            </h2>
                            <p className="text-xl text-gray-300 leading-relaxed">
                                Leverage technology, marketing, and engineering to increase business reach{' '}
                                <span className="gradient-text font-bold">X times</span> more—where X represents
                                unlimited growth potential tailored to your goals. We build for speed, scalability,
                                and long-term success.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
