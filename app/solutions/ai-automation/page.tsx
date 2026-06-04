'use client';

import { m as motion } from 'framer-motion';
import Link from 'next/link';



export default function AIAutomationPage() {
    const techStack = [
        { name: 'Python', icon: '🐍' },
        { name: 'OpenAI API', icon: '🤖' },
        { name: 'LangChain', icon: '🔗' },
        { name: 'Zapier', icon: '⚡' },
        { name: 'Make.com', icon: '🔄' },
        { name: 'n8n', icon: '🎯' },
    ];

    const useCases = [
        {
            title: 'Lead Qualification',
            description: 'AI agents that analyze inbound leads, score them based on your criteria, and route high-value prospects automatically.',
            icon: '🎯',
        },
        {
            title: 'CRM Automation',
            description: 'Eliminate manual data entry. Our workflows sync data across platforms, update records, and trigger actions based on customer behavior.',
            icon: '📊',
        },
        {
            title: 'Customer Support',
            description: 'AI-powered chatbots and email responders that handle tier-1 support, escalating complex issues to your team.',
            icon: '💬',
        },
        {
            title: 'Content Generation',
            description: 'Automated content pipelines for social media, email campaigns, and product descriptions using LLMs.',
            icon: '✍️',
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
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-4xl">
                            🤖
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        AI Automation Systems &{' '}
                        <span className="gradient-text">Custom Operational Intelligence</span>{' '}
                        Workflows
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        We engineer custom AI agents and Python workflows to automate lead qualification, CRM entry, and customer support.
                        Your team focuses on high-value work while AI handles the repetitive tasks.
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
                            Custom AI Agent Workflows Built for{' '}
                            <span className="text-red-400">Enterprise Scale</span>
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="text-center">
                                <div className="text-3xl mb-2">⏰</div>
                                <p className="text-gray-400 text-sm">Your team wastes hours on data entry and repetitive tasks</p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl mb-2">💸</div>
                                <p className="text-gray-400 text-sm">Hiring more people increases costs faster than revenue</p>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl mb-2">🐌</div>
                                <p className="text-gray-400 text-sm">Manual processes create bottlenecks that slow growth</p>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Tech Stack */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        Powered By <span className="gradient-text">Modern AI Tools</span>
                    </h2>
                    <div className="flex flex-wrap justify-center gap-4">
                        {techStack.map((tech, index) => (
                            <motion.div
                                key={tech.name}
                                className="glass px-6 py-4 rounded-full flex items-center gap-3"
                                initial={{ opacity: 0, scale: 0.8 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                                whileHover={{ scale: 1.05 }}
                            >
                                <span className="text-2xl">{tech.icon}</span>
                                <span className="text-gray-300 font-medium">{tech.name}</span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Use Cases */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        What We <span className="gradient-text">Automate</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {useCases.map((useCase, index) => (
                            <motion.div
                                key={useCase.title}
                                className="glass p-8 rounded-xl hover:border-orange-500 transition-all duration-300"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -5 }}
                            >
                                <div className="text-4xl mb-4">{useCase.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{useCase.title}</h3>
                                <p className="text-gray-400 text-sm">{useCase.description}</p>
                            </motion.div>
                        ))}
                    </div>
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
                        Our <span className="gradient-text">Process</span>
                    </h2>
                    <div className="max-w-4xl mx-auto space-y-8">
                        {[
                            {
                                step: '01',
                                title: 'Workflow Audit',
                                description: 'We map your current processes, identify repetitive tasks, and calculate time/cost savings potential.',
                            },
                            {
                                step: '02',
                                title: 'Custom Automation',
                                description: 'Build Python scripts, AI agents, or no-code workflows tailored to your exact needs.',
                            },
                            {
                                step: '03',
                                title: 'Integration & Testing',
                                description: 'Connect to your existing tools (CRM, email, Slack) and test thoroughly before deployment.',
                            },
                            {
                                step: '04',
                                title: 'Monitor & Optimize',
                                description: 'Track performance metrics and continuously improve automation efficiency.',
                            },
                        ].map((item, index) => (
                            <motion.div
                                key={item.step}
                                className="flex gap-6"
                                initial={{ opacity: 0, x: -30 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.2 }}
                            >
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center text-2xl font-bold">
                                        {item.step}
                                    </div>
                                </div>
                                <div className="flex-1 glass p-6 rounded-xl">
                                    <h3 className="text-xl font-bold mb-3 gradient-text">{item.title}</h3>
                                    <p className="text-gray-300">{item.description}</p>
                                </div>
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
                    <div className="glass p-8 rounded-2xl bg-gradient-to-br from-orange-500/5 to-pink-500/5">
                        <h2 className="text-3xl font-bold mb-8 text-center">
                            Expected <span className="gradient-text">Impact</span>
                        </h2>
                        <div className="grid md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">70%</div>
                                <p className="text-gray-400 text-sm">Time Saved</p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">5x</div>
                                <p className="text-gray-400 text-sm">Faster Processing</p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">$0</div>
                                <p className="text-gray-400 text-sm">Hiring Costs</p>
                            </div>
                            <div className="text-center">
                                <div className="text-4xl font-bold gradient-text mb-2">24/7</div>
                                <p className="text-gray-400 text-sm">Automation Runtime</p>
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
                        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-pink-500/5"></div>
                        <div className="relative z-10">
                            <h2 className="text-4xl font-bold mb-4">
                                Ready to <span className="gradient-text">Automate</span> Your Operations?
                            </h2>
                            <p className="text-gray-400 mb-8 text-lg">
                                Let's audit your workflows and engineer AI-powered automation.
                            </p>
                            <Link
                                href="/#contact"
                                className="inline-block px-10 py-5 rounded-lg bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold text-lg hover:shadow-lg hover:shadow-orange-500/50 transition-all duration-300 hover:scale-105"
                            >
                                Start Automating
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
