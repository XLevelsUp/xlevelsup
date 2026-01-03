'use client';

import { motion } from 'framer-motion';
import Form from '@/components/ui/Form';

export default function ContactPage() {
    return (
        <main className="min-h-screen py-24 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <h1 className="text-5xl md:text-6xl font-bold mb-6">
                        Let's Engineer <span className="gradient-text">Your Growth</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-3xl mx-auto">
                        Ready to scale your business with engineering-driven marketing? Let's start with a growth audit.
                    </p>
                </motion.div>

                <div className="grid md:grid-cols-2 gap-12 max-w-6xl mx-auto">
                    {/* Contact Form */}
                    <motion.div
                        className="glass p-8 md:p-12 rounded-2xl"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h2 className="text-2xl font-bold mb-6">Get Your Growth Audit</h2>
                        <Form />
                    </motion.div>

                    {/* Contact Information */}
                    <motion.div
                        className="space-y-6"
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Email Card */}
                        <div className="glass p-6 rounded-xl">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-cyan to-purple flex items-center justify-center flex-shrink-0">
                                    <svg
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Email</h3>
                                    <a
                                        href="mailto:hello@xlevelsup.com"
                                        className="text-gray-400 hover:text-cyan transition-colors duration-200"
                                    >
                                        hello@xlevelsup.com
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Phone Card */}
                        <div className="glass p-6 rounded-xl">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple to-pink-500 flex items-center justify-center flex-shrink-0">
                                    <svg
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Phone</h3>
                                    <a
                                        href="tel:+1234567890"
                                        className="text-gray-400 hover:text-cyan transition-colors duration-200"
                                    >
                                        +91 (XXX) XXX-XXXX
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Location Card */}
                        <div className="glass p-6 rounded-xl">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-cyan flex items-center justify-center flex-shrink-0">
                                    <svg
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                                        <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Location</h3>
                                    <p className="text-gray-400">
                                        Coimbatore, Tamil Nadu<br />
                                        India
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Office Hours Card */}
                        <div className="glass p-6 rounded-xl">
                            <div className="flex items-start gap-4">
                                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-cyan flex items-center justify-center flex-shrink-0">
                                    <svg
                                        className="w-6 h-6 text-white"
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                    </svg>
                                </div>
                                <div>
                                    <h3 className="font-semibold mb-1">Office Hours</h3>
                                    <p className="text-gray-400">
                                        Monday - Friday<br />
                                        9:00 AM - 6:00 PM IST
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Response Time */}
                        <div className="glass p-6 rounded-xl bg-gradient-to-br from-cyan/5 to-purple/5">
                            <h3 className="font-semibold mb-2 gradient-text">Fast Response Time</h3>
                            <p className="text-gray-400 text-sm">
                                We typically respond to all inquiries within 24 hours. For urgent matters, please mention it in your message.
                            </p>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
