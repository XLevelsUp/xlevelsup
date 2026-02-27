'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const solutions = [
    {
        id: 1,
        icon: '🏗️',
        tag: 'Core Infrastructure',
        title: 'Custom Software & Web Platforms',
        description:
            'Your digital presence is your most valuable sales asset. We architect frictionless, high-performance web applications and eCommerce platforms engineered to convert at the highest industry benchmarks—built on Next.js, Headless infrastructure, and enterprise-grade cloud.',
        cta: 'Explore Product Engineering',
        href: '/solutions/marketing-architecture',
        accent: 'cyan',
    },
    {
        id: 2,
        icon: '🤖',
        tag: 'Operational Intelligence',
        title: 'AI & Operational Automation',
        description:
            'Every hour your team spends on repetitive tasks is an hour not spent on growth. We replace manual workflows with intelligent, custom-built AI systems—automating lead qualification, CRM operations, and internal processes so your people focus exclusively on high-leverage decisions.',
        cta: 'Explore AI Automation',
        href: '/solutions/ai-automation',
        accent: 'purple',
    },
    {
        id: 3,
        icon: '📲',
        tag: 'Revenue Engine',
        title: 'Precision Digital Marketing',
        description:
            'We don\'t run ads. We orchestrate algorithmic customer acquisition. Our data-backed performance marketing systems—server-side tracked, creatively engineered, and ROI-measured—turn your marketing spend into a predictable, scalable revenue engine across Meta, Google, and organic channels.',
        cta: 'Explore Growth Marketing',
        href: '/solutions/digital-marketing',
        accent: 'cyan',
    },
    {
        id: 4,
        icon: '🔍',
        tag: 'Authority & Visibility',
        title: 'Search & Authority Engineering',
        description:
            'Digital real estate is finite. We use programmatic content infrastructure, Core Web Vitals optimization, and technical SEO architecture to ensure that when your ideal customers search for solutions—they find you, not your competitors. Compounding, organic, and defensible.',
        cta: 'Explore Search Engineering',
        href: '/solutions/search-engineering',
        accent: 'purple',
    },
];

const accentMap: Record<string, string> = {
    cyan: 'border-cyan/20 hover:border-cyan/60 text-cyan',
    purple: 'border-purple/20 hover:border-purple/60 text-purple',
};

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.15 },
    },
};

const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function Services() {
    return (
        <section className="py-24 px-4 relative" id="services">
            <div className="max-w-7xl mx-auto">
                {/* Section header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="text-cyan text-sm font-semibold tracking-widest uppercase mb-4">
                        Our Solutions
                    </p>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        A Unified{' '}
                        <span className="gradient-text">Technology Ecosystem</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Four integrated disciplines. One strategic partner. Built to compound your market position over time.
                    </p>
                </motion.div>

                {/* Solutions grid */}
                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {solutions.map((s) => {
                        const accentClasses = accentMap[s.accent] ?? accentMap['cyan'];
                        const [borderHover, , tagColor] = accentClasses.split(' ');

                        return (
                            <motion.div
                                key={s.id}
                                variants={cardVariants}
                                className={`glass rounded-2xl p-8 border ${borderHover} transition-all duration-300 flex flex-col group`}
                                whileHover={{ y: -6 }}
                            >
                                {/* Icon + Tag */}
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="text-4xl">{s.icon}</div>
                                    <span className={`text-xs font-bold uppercase tracking-widest ${tagColor} bg-white/5 px-3 py-1 rounded-full border border-current/20`}>
                                        {s.tag}
                                    </span>
                                </div>

                                {/* Title */}
                                <h3 className="text-2xl font-bold mb-4 leading-snug">
                                    {s.title}
                                </h3>

                                {/* Description */}
                                <p className="text-gray-400 leading-relaxed mb-8 flex-1">
                                    {s.description}
                                </p>

                                {/* CTA link */}
                                <Link
                                    href={s.href}
                                    className={`inline-flex items-center gap-2 font-semibold ${tagColor} hover:gap-3 transition-all duration-200 text-sm`}
                                >
                                    {s.cta}
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                    </svg>
                                </Link>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Bottom CTA strip */}
                <motion.div
                    className="mt-16 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="text-gray-400 mb-6 text-lg">
                        Ready to consolidate your tech stack under one focused partner?
                    </p>
                    <a
                        href="#contact"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-gradient-to-r from-cyan to-purple text-white font-bold text-lg hover:shadow-lg hover:shadow-cyan/30 transition-all duration-300 hover:scale-105"
                    >
                        Discuss Your Infrastructure
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
