'use client';

import { m as motion } from 'framer-motion';

export default function ExponentialGraph() {
    return (
        <div className="glass p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-8 text-center">
                Organic Traffic <span className="gradient-text">Velocity</span>
            </h3>

            <div className="relative h-64 mb-6">
                {/* Y-Axis Label */}
                <div className="absolute left-0 top-0 bottom-0 flex items-center">
                    <span className="text-xs text-gray-400 transform -rotate-90 whitespace-nowrap">
                        Organic Traffic
                    </span>
                </div>

                {/* Graph Container */}
                <div className="ml-8 h-full relative">
                    {/* Grid Lines */}
                    <div className="absolute inset-0">
                        {[...Array(5)].map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-full border-t border-gray-800"
                                style={{ top: `${i * 25}%` }}
                            ></div>
                        ))}
                    </div>

                    {/* Exponential Curve */}
                    <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#00F0FF" />
                                <stop offset="100%" stopColor="#B026FF" />
                            </linearGradient>
                            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#B026FF" stopOpacity="0.05" />
                            </linearGradient>
                        </defs>

                        {/* Area under curve */}
                        <motion.path
                            d="M 0 200 L 0 180 Q 100 160, 200 100 T 400 20 L 400 200 Z"
                            fill="url(#areaGradient)"
                            initial={{ opacity: 0 }}
                            whileInView={{ opacity: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1 }}
                        />

                        {/* Curve line */}
                        <motion.path
                            d="M 0 180 Q 100 160, 200 100 T 400 20"
                            stroke="url(#curveGradient)"
                            strokeWidth="3"
                            fill="none"
                            strokeLinecap="round"
                            initial={{ pathLength: 0 }}
                            whileInView={{ pathLength: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 2, ease: "easeInOut" }}
                        />

                        {/* Data points */}
                        {[
                            { x: 0, y: 180 },
                            { x: 100, y: 150 },
                            { x: 200, y: 100 },
                            { x: 300, y: 50 },
                            { x: 400, y: 20 },
                        ].map((point, index) => (
                            <motion.circle
                                key={index}
                                cx={point.x}
                                cy={point.y}
                                r="4"
                                fill="#00F0FF"
                                initial={{ scale: 0 }}
                                whileInView={{ scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: index * 0.3 }}
                            />
                        ))}
                    </svg>

                    {/* X-Axis Label */}
                    <div className="absolute -bottom-6 left-0 right-0 flex justify-between text-xs text-gray-400">
                        <span>Month 1</span>
                        <span>Month 3</span>
                        <span>Month 6</span>
                        <span>Month 12</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-12">
                <div className="text-center">
                    <div className="text-2xl font-bold gradient-text mb-1">3x</div>
                    <div className="text-xs text-gray-400">Month 3 Growth</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold gradient-text mb-1">10x</div>
                    <div className="text-xs text-gray-400">Month 6 Growth</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold gradient-text mb-1">25x</div>
                    <div className="text-xs text-gray-400">Month 12 Growth</div>
                </div>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-purple/10 border border-purple/20">
                <p className="text-sm text-purple-300 text-center">
                    📈 Programmatic Content Generation • 🎯 High-Intent Keyword Targeting • ⚡ Technical SEO Optimization
                </p>
            </div>
        </div>
    );
}
