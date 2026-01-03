'use client';

import { motion } from 'framer-motion';

export default function About() {
    return (
        <section className="py-24 px-4" id="about">
            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-4xl md:text-5xl font-bold mb-6">
                            The <span className="gradient-text">Engineering</span> Approach to Marketing
                        </h2>
                        <p className="text-gray-300 text-lg leading-relaxed mb-6">
                            At XLEVELSUP, we don't just build websites and run ads—we engineer growth systems.
                            Our team analyzes your existing workflows, digital presence, and performance metrics to
                            identify opportunities for optimization.
                        </p>
                        <p className="text-gray-300 text-lg leading-relaxed mb-6">
                            Then we apply technology, automation, and data-driven strategies to build solutions
                            designed for speed, scalability, and measurable outcomes. Every project is engineered
                            to convert traffic into real leads and revenue.
                        </p>
                        <div className="grid grid-cols-2 gap-6 mt-8">
                            <div className="glass p-6 rounded-lg">
                                <div className="text-3xl font-bold gradient-text mb-2">X∞</div>
                                <div className="text-gray-400">Unlimited Growth Potential</div>
                            </div>
                            <div className="glass p-6 rounded-lg">
                                <div className="text-3xl font-bold gradient-text mb-2">100%</div>
                                <div className="text-gray-400">Engineering-Driven</div>
                            </div>
                        </div>
                    </motion.div>

                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="glass p-12 rounded-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 to-purple/10"></div>
                            <div className="relative z-10">
                                <div className="text-6xl mb-6">⚡</div>
                                <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
                                <p className="text-gray-300 leading-relaxed">
                                    Leverage technology, marketing, and engineering to increase business reach <span className="gradient-text font-bold">X times</span> more—where X represents unlimited growth potential tailored to your goals. We build for speed, scalability, and long-term success.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
