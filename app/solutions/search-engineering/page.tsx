'use client';

import { m as motion } from 'framer-motion';
import Link from 'next/link';
import ComparisonTable from '@/components/solutions/ComparisonTable';
import ExponentialGraph from '@/components/solutions/ExponentialGraph';



export default function SearchEngineeringPage() {
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
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-cyan flex items-center justify-center text-4xl">
                            🔍
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        Dominate <span className="gradient-text">Search Intent</span>.
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        We don't write random blogs. We build programmatic content engines that capture
                        high-intent traffic at scale. Every page is engineered for conversion.
                    </p>
                </motion.div>

                {/* The Difference */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="glass p-8 rounded-2xl">
                        <h2 className="text-3xl font-bold mb-6 text-center">
                            Why <span className="gradient-text">Search Engineering</span> Works
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">10x</div>
                                <p className="text-gray-400 text-sm">More pages indexed than manual blogging</p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">3x</div>
                                <p className="text-gray-400 text-sm">Higher conversion rate from organic traffic</p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">100%</div>
                                <p className="text-gray-400 text-sm">Core Web Vitals compliance</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Comparison Table */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <ComparisonTable />
                </motion.div>

                {/* How It Works */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        The <span className="gradient-text">Engineering</span> Process
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {[
                            {
                                step: '01',
                                title: 'Keyword Research at Scale',
                                description: 'We use data science to identify thousands of high-intent, low-competition keywords.',
                                icon: '🎯',
                            },
                            {
                                step: '02',
                                title: 'Programmatic Page Generation',
                                description: 'Build templates that automatically generate SEO-optimized pages for each keyword cluster.',
                                icon: '⚙️',
                            },
                            {
                                step: '03',
                                title: 'Technical SEO Foundation',
                                description: 'Schema.org markup, XML sitemaps, canonical tags, and Core Web Vitals optimization.',
                                icon: '🔧',
                            },
                            {
                                step: '04',
                                title: 'Content Velocity',
                                description: 'Launch hundreds of pages in weeks, not months. Scale content production 10x.',
                                icon: '🚀',
                            },
                        ].map((item, index) => (
                            <motion.div
                                key={item.step}
                                className="glass p-8 rounded-xl hover:border-cyan transition-all duration-300"
                                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <div className="flex items-start gap-4">
                                    <div className="text-4xl">{item.icon}</div>
                                    <div className="flex-1">
                                        <div className="text-sm text-cyan font-mono mb-2">{item.step}</div>
                                        <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                        <p className="text-gray-400 text-sm">{item.description}</p>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Traffic Growth Graph */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <ExponentialGraph />
                </motion.div>

                {/* What's Included */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        What's <span className="gradient-text">Included</span>
                    </h2>
                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            'Keyword Research & Clustering',
                            'Programmatic Page Templates',
                            'Schema.org Implementation',
                            'Core Web Vitals Optimization',
                            'XML Sitemap Generation',
                            'Internal Linking Strategy',
                            'Content Velocity System',
                            'Analytics & Tracking Setup',
                            'Monthly Performance Reports',
                        ].map((item, index) => (
                            <motion.div
                                key={item}
                                className="glass p-6 rounded-xl flex items-center gap-3"
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: index * 0.05 }}
                            >
                                <span className="text-cyan text-xl">✓</span>
                                <span className="text-gray-300">{item}</span>
                            </motion.div>
                        ))}
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
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan/5"></div>
                        <div className="relative z-10">
                            <h2 className="text-4xl font-bold mb-4">
                                Ready to <span className="gradient-text">Start</span> Search Engineering?
                            </h2>
                            <p className="text-gray-400 mb-8 text-lg">
                                Let's build a programmatic content engine that dominates your niche.
                            </p>
                            <Link
                                href="/#contact"
                                className="inline-block px-10 py-5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan text-white font-bold text-lg hover:shadow-lg hover:shadow-cyan/50 transition-all duration-300 hover:scale-105"
                            >
                                Start Search Engineering
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
