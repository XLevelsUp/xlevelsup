'use client';

import { m as motion } from 'framer-motion';

export default function LighthouseScore() {
    const metrics = [
        { name: 'Performance', score: 100, color: 'from-green-400 to-green-600' },
        { name: 'Accessibility', score: 100, color: 'from-green-400 to-green-600' },
        { name: 'Best Practices', score: 100, color: 'from-green-400 to-green-600' },
        { name: 'SEO', score: 100, color: 'from-green-400 to-green-600' },
    ];

    return (
        <div className="glass p-8 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan to-purple flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                        <path d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                    </svg>
                </div>
                <div>
                    <h3 className="text-xl font-bold">Google Lighthouse Vitals</h3>
                    <p className="text-sm text-gray-400">All Green. Every Time.</p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {metrics.map((metric, index) => (
                    <motion.div
                        key={metric.name}
                        className="text-center"
                        initial={{ opacity: 0, scale: 0.8 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                        <div className="relative w-24 h-24 mx-auto mb-3">
                            {/* Circular Progress */}
                            <svg className="w-full h-full transform -rotate-90">
                                <circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="rgba(255,255,255,0.1)"
                                    strokeWidth="8"
                                    fill="none"
                                />
                                <motion.circle
                                    cx="48"
                                    cy="48"
                                    r="40"
                                    stroke="url(#gradient)"
                                    strokeWidth="8"
                                    fill="none"
                                    strokeLinecap="round"
                                    initial={{ strokeDasharray: '251.2', strokeDashoffset: '251.2' }}
                                    whileInView={{ strokeDashoffset: '0' }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 1.5, delay: index * 0.1 }}
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                        <stop offset="0%" stopColor="#10b981" />
                                        <stop offset="100%" stopColor="#059669" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl font-bold text-green-400">{metric.score}</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-300 font-medium">{metric.name}</p>
                    </motion.div>
                ))}
            </div>

            <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-400 text-center">
                    ✓ Core Web Vitals Passed • ✓ Mobile Optimized • ✓ Production Ready
                </p>
            </div>
        </div>
    );
}
