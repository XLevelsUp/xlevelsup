'use client';

import { m as motion } from 'framer-motion';
import Link from 'next/link';



export default function DigitalMarketingPage() {
    const processSteps = [
        {
            title: 'Data-Backed Scripting',
            description:
                'Video hooks written from live platform trend data and competitor ad analysis. Every script is a hypothesis designed to beat a benchmark — not just fill a brief.',
            icon: '📝',
            label: 'Trend-Led Hooks',
            accent: 'text-cyan',
        },
        {
            title: 'Studio Production',
            description:
                'Professional video shooting and editing in partnership with premium studios. Every deliverable is natively formatted for Instagram Reels, TikTok, and YouTube Shorts.',
            icon: '🎬',
            label: 'Mobile-Native Format',
            accent: 'text-purple',
        },
        {
            title: 'Social Media Management',
            description:
                'Consistent, high-quality organic posting managed end-to-end. We own your content calendar, captions, hashtag strategy, and community engagement.',
            icon: '📱',
            label: 'Always-On Presence',
            accent: 'text-cyan',
        },
        {
            title: 'Paid Amplification',
            description:
                'Top-performing organic content is injected into targeted Meta and Google Ads campaigns — turning proven hooks into paid assets that scale reach and revenue.',
            icon: '🚀',
            label: 'Organic × Paid Flywheel',
            accent: 'text-purple',
        },
    ];

    const toolStack = [
        { name: 'Meta Ads Manager', icon: '🎯' },
        { name: 'Premiere Pro', icon: '🎞️' },
        { name: 'CapCut Pro', icon: '✂️' },
        { name: 'Content Calendars', icon: '📅' },
        { name: 'GA4', icon: '📊' },
    ];

    const metrics = [
        { value: '4×', label: 'average reach lift when organic winners are pushed to paid' },
        { value: '30+', label: 'pieces of content produced and posted per month per client' },
        { value: '<48h', label: 'turnaround from brief approval to first-cut video delivery' },
    ];

    return (
        <main className="min-h-screen py-24 px-4">
            <div className="max-w-7xl mx-auto">

                {/* ── Hero ── */}
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-block mb-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-cyan to-purple flex items-center justify-center text-4xl">
                            📲
                        </div>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                        Tech-Driven{' '}
                        <span className="gradient-text">Digital</span>{' '}
                        Marketing.
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
                        We partner with premium studios to shoot high-retention content, then use algorithmic
                        distribution and Meta Ads to turn viewers into revenue.
                    </p>
                </motion.div>

                {/* ── Proof Stats ── */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="glass p-8 rounded-2xl">
                        <h2 className="text-3xl font-bold mb-6 text-center">
                            Why <span className="gradient-text">Content + Distribution</span> = Revenue
                        </h2>
                        <div className="grid md:grid-cols-3 gap-6">
                            {metrics.map((m) => (
                                <div key={m.value} className="text-center">
                                    <div className="text-4xl font-bold gradient-text mb-2">{m.value}</div>
                                    <p className="text-gray-400 text-sm">{m.label}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* ── The Process ── */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        The <span className="gradient-text">Process</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                        {processSteps.map((step, index) => (
                            <motion.div
                                key={step.title}
                                className="glass p-8 rounded-xl hover:border-cyan transition-all duration-300"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -10 }}
                            >
                                <div className="text-5xl mb-4">{step.icon}</div>
                                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                                <p className={`text-sm mb-3 ${step.accent}`}>{step.label}</p>
                                <p className="text-gray-400 text-sm leading-relaxed">
                                    {step.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ── Tool Stack ── */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        The <span className="gradient-text">Tool Stack</span>
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {toolStack.map((tool, index) => (
                            <motion.div
                                key={tool.name}
                                className="glass p-6 rounded-xl flex flex-col items-center text-center hover:border-cyan transition-all duration-300"
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                                whileHover={{ y: -10 }}
                            >
                                <div className="text-4xl mb-3">{tool.icon}</div>
                                <p className="text-sm font-semibold text-gray-300">{tool.name}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ── What You Get ── */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-3xl font-bold mb-12 text-center">
                        What You <span className="gradient-text">Get</span>
                    </h2>
                    <div className="grid md:grid-cols-2 gap-6">
                        {[
                            { title: 'Trend-Led Scripts & Hooks', desc: 'Data-informed scripts written to capture attention in the first 3 seconds on every platform.' },
                            { title: 'Studio-Quality Video Assets', desc: 'Mobile-first video deliverables in all required formats — Reels, Shorts, TikTok, and square.' },
                            { title: 'Full Social Media Management', desc: 'End-to-end management of your brand presence: posting, captions, hashtags, and engagement.' },
                            { title: 'Paid Ad Creatives', desc: 'Organic winners repurposed and deployed as Meta/Google ad creatives — no wasted production budget.' },
                            { title: 'Monthly Performance Report', desc: 'Clear reporting on reach, engagement, CPM, CPC, and ROAS — tied to business outcomes.' },
                            { title: 'Continuous Content Testing', desc: 'Ongoing A/B testing of hooks, formats, and posting times to stay ahead of algorithm shifts.' },
                        ].map((item, index) => (
                            <motion.div
                                key={item.title}
                                className="glass p-6 rounded-xl"
                                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <h3 className="font-bold mb-2 gradient-text">{item.title}</h3>
                                <p className="text-gray-400 text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* ── CTA ── */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="glass p-12 rounded-2xl max-w-3xl mx-auto relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-purple/5" />
                        <div className="relative z-10">
                            <h2 className="text-4xl font-bold mb-4">
                                Ready to <span className="gradient-text">Grow</span> Your Digital Presence?
                            </h2>
                            <p className="text-gray-400 mb-8 text-lg">
                                Let's audit your content, map your audience, and build a system that turns attention into revenue.
                            </p>
                            <Link
                                href="/#contact"
                                className="inline-block px-10 py-5 rounded-lg bg-gradient-to-r from-cyan to-purple text-white font-bold text-lg hover:shadow-lg hover:shadow-purple/50 transition-all duration-300 hover:scale-105"
                            >
                                Start My Marketing Engine
                            </Link>
                        </div>
                    </div>
                </motion.div>

            </div>
        </main>
    );
}
