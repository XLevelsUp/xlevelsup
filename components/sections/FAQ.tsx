'use client';

import { useState } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';

const faqs = [
    {
        id: 1,
        question: 'What does XLEVELSUP actually do?',
        answer:
            'XLEVELSUP is your end-to-end growth partner. We handle everything a business needs to grow digitally — logo and brand identity design, marketing and eCommerce websites, Meta Ads and social media management, Google Ads campaigns, ERP and enterprise software development, and AI workflow automation. One partner. All disciplines. All under one roof in Coimbatore, India.',
    },
    {
        id: 2,
        question: 'Are you an agency or a software company?',
        answer:
            'Both — and that\'s the point. Most agencies can\'t write code. Most software companies can\'t run ads. XLEVELSUP combines both. We\'re a full-service digital agency that also builds enterprise-grade software, ERP systems, and AI automation. You get creative execution and engineering depth from the same team, with no handoff problems between vendors.',
    },
    {
        id: 3,
        question: 'How is XLEVELSUP different from other digital agencies?',
        answer:
            'Most agencies specialise in one channel — social media, or SEO, or web design. XLEVELSUP covers the entire stack: design, development, advertising, automation, and analytics. Our approach is engineering-driven — we apply data and systems thinking to every service, not guesswork. And because we build both the marketing and the technology, every layer compounds on the one before it.',
    },
    {
        id: 4,
        question: 'What does working with XLEVELSUP look like?',
        answer:
            'We start with a discovery session to understand your business, goals, and current gaps. From there, we propose the specific services that will move the needle — whether that\'s a website rebuild, an ad campaign, an ERP system, or AI automation. We work in focused sprints with clear deliverables, keeping you informed at every stage. Most clients start seeing measurable results within 30–60 days.',
    },
    {
        id: 5,
        question: 'How do I get started?',
        answer:
            'Simple — fill out the contact form below or reach out directly at hello@xlevelsup.com. We\'ll schedule a free growth audit call where we review your current setup, identify gaps, and outline a clear path forward. No commitment required to start the conversation.',
    },
];

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: { staggerChildren: 0.1 },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function FAQ() {
    const [openId, setOpenId] = useState<number | null>(null);

    const toggle = (id: number) => setOpenId(openId === id ? null : id);

    return (
        <section className="py-24 px-4 relative" id="faq">
            <div className="max-w-4xl mx-auto">
                {/* Section header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="text-cyan text-sm font-semibold tracking-widest uppercase mb-4">
                        Common Questions
                    </p>
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Frequently Asked{' '}
                        <span className="gradient-text">Questions</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Everything you need to know before we get started.
                    </p>
                </motion.div>

                {/* Accordion items */}
                <motion.div
                    className="space-y-4"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {faqs.map((faq) => {
                        const isOpen = openId === faq.id;
                        return (
                            <motion.div
                                key={faq.id}
                                variants={itemVariants}
                                className="glass rounded-2xl overflow-hidden"
                            >
                                <button
                                    onClick={() => toggle(faq.id)}
                                    className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-white/5 transition-colors duration-200 cursor-pointer"
                                    aria-expanded={isOpen}
                                >
                                    <h3 className="text-lg font-semibold text-white pr-4">
                                        {faq.question}
                                    </h3>
                                    <svg
                                        className={`w-5 h-5 text-cyan flex-shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth={2}
                                        viewBox="0 0 24 24"
                                        aria-hidden="true"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                <AnimatePresence initial={false}>
                                    {isOpen && (
                                        <motion.div
                                            key="answer"
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                            className="overflow-hidden"
                                        >
                                            <div className="px-8 pb-6 pt-0 border-t border-white/10">
                                                <p className="text-gray-300 leading-relaxed pt-5">
                                                    {faq.answer}
                                                </p>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </motion.div>

                {/* Bottom CTA */}
                <motion.div
                    className="mt-16 text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="text-gray-400 mb-6 text-lg">
                        Still have questions? Let&apos;s talk.
                    </p>
                    <a
                        href="#contact"
                        className="inline-flex items-center gap-2 px-8 py-4 rounded-lg bg-linear-to-r from-cyan to-purple text-white font-bold text-lg hover:shadow-lg hover:shadow-cyan/30 transition-all duration-300 hover:scale-105"
                    >
                        Book a Free Growth Audit
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </a>
                </motion.div>
            </div>
        </section>
    );
}
