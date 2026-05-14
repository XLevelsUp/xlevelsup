'use client';

import { m as motion } from 'framer-motion';
import Link from 'next/link';
import SystemDiagram from '@/components/solutions/SystemDiagram';



export default function GrowthSystemsPage() {
    const features = [
        {
            title: 'Server-Side API Tracking',
            description: 'Bypass iOS blocks and ad blockers with server-side conversion tracking.',
            icon: '🔒',
            benefits: ['100% Accurate Data', 'Privacy Compliant', 'Platform Independent'],
        },
        {
            title: 'Automated Lead Nurturing',
            description: 'SMS and email sequences that convert leads while you sleep.',
            icon: '🤖',
            benefits: ['Multi-Channel', 'Behavior Triggered', 'Personalized Content'],
        },
        {
            title: 'Real-Time ROAS Dashboards',
            description: 'Know your return on ad spend instantly, optimize campaigns on the fly.',
            icon: '📊',
            benefits: ['Live Metrics', 'Revenue Attribution', 'Campaign Insights'],
        },
    ];

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
                    <div className="inline-block mb-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple to-pink-500 flex items-center justify-center text-4xl">
                            📈
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        <span className="gradient-text">Algorithmic</span> User Acquisition.
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        We use server-side tracking to feed ad platforms better data, lowering your CAC.
                        Every conversion event is captured, every dollar is tracked, every campaign is optimized.
                    </p>
                </motion.div>

                {/* The Problem */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="glass p-8 rounded-2xl border-red-500/20">
                        <h2 className="text-2xl font-bold mb-4 text-center">
                            The <span className="text-red-400">Problem</span> with Traditional Tracking
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-3xl mb-2">🚫</div>
                                <p className="text-gray-400 text-sm">iOS 14.5+ blocks 60% of tracking pixels</p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl mb-2">📉</div>
                                <p className="text-gray-400 text-sm">Ad platforms make bad decisions with incomplete data</p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl mb-2">💸</div>
                                <p className="text-gray-400 text-sm">You waste budget on campaigns that don't convert</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* System Diagram */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <SystemDiagram />
                </motion.div>

                {/* Features */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        The <span className="gradient-text">System</span> Features
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                className="glass p-8 rounded-xl hover:border-purple transition-all duration-300"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -10 }}
                            >
                                <div className="text-5xl mb-4 text-center">{feature.icon}</div>
                                <h3 className="text-xl font-bold mb-3 text-center">{feature.title}</h3>
                                <p className="text-gray-400 text-sm mb-4 text-center">{feature.description}</p>
                                <ul className="space-y-2">
                                    {feature.benefits.map((benefit) => (
                                        <li key={benefit} className="flex items-center gap-2 text-sm text-gray-400">
                                            <span className="text-purple">✓</span>
                                            {benefit}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Results */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="glass p-8 rounded-2xl bg-gradient-to-br from-purple/5 to-pink/5">
                        <h2 className="text-3xl font-bold mb-8 text-center">
                            Expected <span className="gradient-text">Results</span>
                        </h2>
                        <div className="grid md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">-40%</div>
                                <p className="text-gray-400 text-sm">Lower CAC</p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">+60%</div>
                                <p className="text-gray-400 text-sm">More Conversions</p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">8x</div>
                                <p className="text-gray-400 text-sm">Average ROAS</p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">100%</div>
                                <p className="text-gray-400 text-sm">Data Accuracy</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* CTA */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="glass p-12 rounded-2xl max-w-3xl mx-auto relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple/5 to-pink/5"></div>
                        <div className="relative z-10">
                            <h2 className="text-4xl font-bold mb-4">
                                Ready to <span className="gradient-text">Deploy</span> Your Growth System?
                            </h2>
                            <p className="text-gray-400 mb-8 text-lg">
                                Let's engineer a data-driven acquisition system that scales.
                            </p>
                            <Link
                                href="/#contact"
                                className="inline-block px-10 py-5 rounded-lg bg-gradient-to-r from-purple to-pink-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-pink-500/50 transition-all duration-300 hover:scale-105"
                            >
                                Deploy Growth System
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
