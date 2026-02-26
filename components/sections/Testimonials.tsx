'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Testimonials() {
    const testimonials = [
        {
            id: 1,
            name: 'Poorani Anandakumar',
            company: 'Pratyagara Silks',
            quote: 'XLEVELSUP engineered our entire digital presence from scratch. Their technical approach to eCommerce resulted in a 300% increase in online revenue within 6 months.',
        },
        {
            id: 2,
            name: 'Sandesh Anantha Kumar',
            company: 'Wanderingkite Studio',
            quote: 'They analyzed our workflows, optimized our tech stack, and built a high-performance platform. Page load times dropped by 70%, conversions increased by 2.5x.',
        },
        {
            id: 3,
            name: 'Anand Kumar',
            company: 'Sakthi Chains',
            quote: 'Not just marketing—growth engineering. They automated our customer acquisition, optimized our ad spend, and delivered 8x ROI on every campaign.',
        },
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    const nextTestimonial = () => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    };

    const prevTestimonial = () => {
        setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
    };

    return (
        <section className="py-24 px-4 bg-dark-800/30" id="testimonials">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        What Our <span className="gradient-text">Clients Say</span>
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Real results from real partnerships
                    </p>
                </motion.div>

                <div className="relative">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentIndex}
                            className="glass p-12 rounded-2xl text-center"
                            initial={{ opacity: 0, x: 100 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ duration: 0.5 }}
                        >
                            <div className="text-5xl mb-6 text-cyan">"</div>
                            <p className="text-xl text-gray-300 leading-relaxed mb-8">
                                {testimonials[currentIndex].quote}
                            </p>
                            <div>
                                <div className="font-bold text-lg gradient-text">
                                    {testimonials[currentIndex].name}
                                </div>
                                <div className="text-gray-400">
                                    {testimonials[currentIndex].company}
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Navigation buttons */}
                    <div className="flex justify-center gap-6 mt-8">
                        <button
                            onClick={prevTestimonial}
                            className="glass w-14 h-14 rounded-full flex items-center justify-center hover:border-cyan transition-colors cursor-pointer"
                            aria-label="Previous testimonial"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M15 19l-7-7 7-7"></path>
                            </svg>
                        </button>
                        <button
                            onClick={nextTestimonial}
                            className="glass w-14 h-14 rounded-full flex items-center justify-center hover:border-cyan transition-colors cursor-pointer"
                            aria-label="Next testimonial"
                        >
                            <svg
                                className="w-6 h-6"
                                fill="none"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path d="M9 5l7 7-7 7"></path>
                            </svg>
                        </button>
                    </div>

                    {/* Dots indicator */}
                    <div className="flex justify-center gap-3 mt-6">
                        {testimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`min-w-3 min-h-3 cursor-pointer rounded-full transition-all ${index === currentIndex
                                    ? 'bg-gradient-to-r from-cyan to-purple w-8'
                                    : 'bg-gray-600'
                                    }`}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
