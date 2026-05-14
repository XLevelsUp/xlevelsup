'use client';

import { m as motion } from 'framer-motion';
import Link from 'next/link';
import type { Solution } from '@/config/solutions.config';

interface SolutionLayoutProps {
    solution: Solution;
}

export default function SolutionLayout({ solution }: SolutionLayoutProps) {
    return (
        <main className="min-h-screen py-24 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        {solution.title.split(' ')[0]}{' '}
                        <span className="gradient-text">{solution.title.split(' ').slice(1).join(' ')}</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        {solution.subtitle}
                    </p>
                </motion.div>

                {/* Tech Stack Strip */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-2xl font-bold text-center mb-8">
                        Powered By <span className="gradient-text">Modern Tech</span>
                    </h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {solution.techStack.map((tech, index) => (
                            <motion.div
                                key={tech}
                                className="glass px-6 py-3 rounded-full"
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <span className="text-gray-300 font-medium">{tech}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Process Timeline */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Our <span className="gradient-text">Process</span>
                    </h2>
                    <div className="max-w-4xl mx-auto space-y-8">
                        {solution.processSteps.map((step, index) => (
                            <motion.div
                                key={step.number}
                                className="flex gap-6"
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                            >
                                {/* Step Number */}
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan to-purple flex items-center justify-center text-2xl font-bold">
                                        {step.number}
                                    </div>
                                    {index < solution.processSteps.length - 1 && (
                                        <div className="w-0.5 h-16 bg-gradient-to-b from-purple to-transparent mx-auto mt-2"></div>
                                    )}
                                </div>

                                {/* Step Content */}
                                <div className="flex-1 glass p-6 rounded-xl">
                                    <h3 className="text-2xl font-bold mb-3 gradient-text">{step.title}</h3>
                                    <p className="text-gray-300 leading-relaxed">{step.description}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Benefits Grid */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold text-center mb-12">
                        Key <span className="gradient-text">Benefits</span>
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {solution.benefits.map((benefit, index) => (
                            <motion.div
                                key={benefit.title}
                                className="glass p-6 rounded-xl hover:border-cyan transition-all duration-300"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="text-4xl mb-4">{benefit.icon}</div>
                                <h3 className="text-xl font-bold mb-2">{benefit.title}</h3>
                                <p className="text-gray-400">{benefit.description}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* CTA Banner */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="glass p-12 rounded-2xl max-w-3xl mx-auto relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-purple/5"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-4">
                                Ready to Upgrade <span className="gradient-text">Your Stack?</span>
                            </h2>
                            <p className="text-gray-400 mb-8">
                                Let's analyze your current setup and engineer a solution tailored to your business goals.
                            </p>
                            <Link
                                href="/#contact"
                                className="inline-block px-8 py-4 rounded-lg bg-gradient-to-r from-cyan to-purple text-white font-semibold hover:shadow-lg hover:shadow-purple/50 transition-all duration-300"
                            >
                                Get Your Growth Audit
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
