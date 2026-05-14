'use client';

import { m as motion } from 'framer-motion';

const problems = [
    {
        icon: '🧩',
        text: 'Slow, outdated websites that bleed traffic and erode trust before a sale is even possible.',
    },
    {
        icon: '⚙️',
        text: 'Manual, repetitive workflows consuming your team\'s time—work that should be handled by intelligent systems.',
    },
    {
        icon: '📣',
        text: 'Disconnected marketing agencies that guess rather than measure, burning budget without a coherent strategy.',
    },
];

export default function About() {
    return (
        <section className="py-24 px-4" id="about">
            <div className="max-w-6xl mx-auto">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    {/* Left: Problem / Solution narrative */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Section eyebrow */}
                        <p className="text-cyan text-sm font-semibold tracking-widest uppercase mb-4">
                            Why XLEVELSUP
                        </p>

                        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                            Fragmented Systems Are{' '}
                            <span className="gradient-text">Killing Your Growth.</span>
                        </h2>

                        <p className="text-gray-300 text-lg leading-relaxed mb-8">
                            Most businesses are held back by the same silent constraints:
                        </p>

                        {/* Problem list */}
                        <ul className="space-y-5 mb-10">
                            {problems.map((p, i) => (
                                <motion.li
                                    key={i}
                                    className="flex items-start gap-4 text-gray-300"
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.5, delay: i * 0.15 }}
                                >
                                    <span className="text-2xl mt-0.5 flex-shrink-0">{p.icon}</span>
                                    <span className="leading-relaxed">{p.text}</span>
                                </motion.li>
                            ))}
                        </ul>

                        <p className="text-gray-300 text-lg leading-relaxed">
                            <span className="text-white font-semibold">We built XLEVELSUP to eliminate this problem entirely.</span>{' '}
                            We are not a vendor—we are your end-to-end technology partner.
                            We design cohesive digital ecosystems where your software, automation,
                            and customer acquisition strategies work{' '}
                            <span className="gradient-text font-semibold">flawlessly together.</span>
                        </p>
                    </motion.div>

                    {/* Right: Resolution card */}
                    <motion.div
                        className="relative"
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="glass p-10 rounded-2xl relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan/10 to-purple/10"></div>
                            <div className="relative z-10">
                                <div className="text-5xl mb-6">⚡</div>
                                <h3 className="text-2xl font-bold mb-6">The XLU Advantage</h3>
                                <ul className="space-y-4 text-gray-300">
                                    {[
                                        { icon: '→', label: 'One partner.', sub: 'Software, automation & marketing—unified.' },
                                        { icon: '→', label: 'Precision over guesswork.', sub: 'Every decision is backed by data and systems.' },
                                        { icon: '→', label: 'Infrastructure that compounds.', sub: 'Built to scale from day one, not retrofitted.' },
                                        { icon: '→', label: 'Full-stack accountability.', sub: 'We own outcomes, not just deliverables.' },
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3">
                                            <span className="text-cyan mt-1 font-bold">{item.icon}</span>
                                            <span>
                                                <span className="text-white font-semibold">{item.label}</span>{' '}
                                                {item.sub}
                                            </span>
                                        </li>
                                    ))}
                                </ul>

                                {/* Stat strip */}
                                <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-white/10">
                                    <div>
                                        <div className="text-3xl font-bold gradient-text mb-1">95+</div>
                                        <div className="text-gray-400 text-sm">Lighthouse Score, Every Build</div>
                                    </div>
                                    <div>
                                        <div className="text-3xl font-bold gradient-text mb-1">4+</div>
                                        <div className="text-gray-400 text-sm">Active Business Partners</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
