'use client';

import { motion } from 'framer-motion';

export default function ComparisonTable() {
    const comparisons = [
        {
            feature: 'Content Strategy',
            standard: 'Manual blogging, random topics',
            engineering: 'Programmatic page generation at scale',
        },
        {
            feature: 'Technical Setup',
            standard: 'Basic meta tag guessing',
            engineering: 'Schema.org JSON-LD, structured data',
        },
        {
            feature: 'Performance',
            standard: 'Slow load times, poor UX',
            engineering: 'Core Web Vitals optimized',
        },
        {
            feature: 'Measurement',
            standard: 'Vanity metrics (views, clicks)',
            engineering: 'Revenue attribution, conversion tracking',
        },
        {
            feature: 'Scalability',
            standard: 'Linear growth, manual effort',
            engineering: 'Exponential growth, automated systems',
        },
    ];

    return (
        <div className="glass p-8 rounded-2xl overflow-hidden">
            <h3 className="text-2xl font-bold mb-8 text-center">
                Standard SEO vs <span className="gradient-text">Search Engineering</span>
            </h3>

            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-700">
                            <th className="text-left py-4 px-4 text-gray-400 font-semibold">Feature</th>
                            <th className="text-left py-4 px-4 text-gray-400 font-semibold">
                                <span className="flex items-center gap-2">
                                    <span className="text-red-400">❌</span> Standard SEO
                                </span>
                            </th>
                            <th className="text-left py-4 px-4 text-gray-400 font-semibold">
                                <span className="flex items-center gap-2">
                                    <span className="text-green-400">✓</span> Search Engineering
                                </span>
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {comparisons.map((row, index) => (
                            <motion.tr
                                key={row.feature}
                                className="border-b border-gray-800 hover:bg-dark-700/50 transition-colors duration-200"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.3, delay: index * 0.1 }}
                            >
                                <td className="py-4 px-4 font-semibold text-white">{row.feature}</td>
                                <td className="py-4 px-4 text-gray-400 text-sm">{row.standard}</td>
                                <td className="py-4 px-4 text-cyan text-sm font-medium">{row.engineering}</td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-6 p-4 rounded-lg bg-gradient-to-r from-cyan/10 to-purple/10 border border-cyan/20">
                <p className="text-sm text-center">
                    <span className="gradient-text font-bold">Search Engineering</span> = SEO + Software Development + Data Science
                </p>
            </div>
        </div>
    );
}
