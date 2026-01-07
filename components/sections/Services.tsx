'use client';

import { motion } from 'framer-motion';
import Card from '../ui/Card';

export default function Services() {
    const services = [
        {
            id: 1,
            title: 'High-Performance Websites',
            description: 'Lightning-fast marketing websites engineered for conversion. Built with modern frameworks, optimized for speed, and designed to turn visitors into customers.',
            icon: '🎨',
            className: '',
        },
        {
            id: 2,
            title: 'Scalable eCommerce Apps',
            description: 'Custom-built eCommerce platforms and Shopify solutions engineered for growth. Every line of code optimized for performance and revenue generation.',
            icon: '🛒',
            className: '',
        },
        {
            id: 3,
            title: 'Data-Driven Ad Campaigns',
            description: 'SEO strategies and paid advertising campaigns backed by analytics. We engineer visibility, optimize for conversions, and maximize customer acquisition ROI.',
            icon: '📈',
            className: '',
        },
        {
            id: 4,
            title: 'Growth Engineering',
            description: 'We analyze your workflows, digital presence, and metrics, then apply technology and automation to engineer measurable efficiency improvements.',
            icon: '📊',
            className: '',
        },
        {
            id: 5,
            title: 'AI & Automation',
            description: 'We engineer custom AI agents and intelligent workflows that handle lead qualification, CRM management, and 24/7 customer support, allowing you to scale your business without increasing headcount.',
            icon: '🤖',
            className: 'md:col-span-2',
        },
    ];
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.2,
            },
        },
    };

    return (
        <section className="py-24 px-4 relative" id="services">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Our <span className="gradient-text">Services</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Comprehensive solutions to accelerate your digital transformation
                    </p>
                </motion.div>

                <motion.div
                    className="grid grid-cols-1 md:grid-cols-2 gap-8"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {services.map((service) => (
                        <Card
                            key={service.id}
                            title={service.title}
                            description={service.description}
                            icon={service.icon}
                            className={service.className}
                        />
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
