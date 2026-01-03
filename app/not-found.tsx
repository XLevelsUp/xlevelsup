'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function NotFound() {
    const router = useRouter();

    return (
        <main className="min-h-screen flex items-center justify-center px-4 py-24">
            <div className="max-w-4xl mx-auto text-center">
                {/* Animated 404 */}
                <motion.div
                    className="mb-8"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="relative inline-block">
                        <h1 className="text-9xl md:text-[12rem] font-bold gradient-text">
                            404
                        </h1>
                        <motion.div
                            className="absolute top-0 left-40 w-16 h-16 rounded-full bg-gradient-to-r from-cyan to-purple blur-xl"
                            animate={{
                                scale: [1, 1.2, 1],
                                opacity: [0.5, 0.8, 0.5],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut",
                            }}
                        />
                    </div>
                </motion.div>

                {/* Error Message */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                >
                    <h2 className="text-3xl md:text-4xl font-bold mb-4">
                        Page Not <span className="gradient-text">Found</span>
                    </h2>
                    <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
                        Looks like this URL doesn't exist in our architecture.
                        Even our engineering can't find what you're looking for.
                    </p>
                </motion.div>

                {/* Suggestions */}
                <motion.div
                    className="glass p-8 rounded-2xl mb-8"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                >
                    <h3 className="text-xl font-bold mb-6">
                        Try These <span className="gradient-text">Instead</span>
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4">
                        <Link
                            href="/"
                            className="glass p-4 rounded-lg hover:border-cyan transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🏠</span>
                                <div className="text-left">
                                    <div className="font-semibold group-hover:text-cyan transition-colors">Home</div>
                                    <div className="text-sm text-gray-400">Back to landing page</div>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/about"
                            className="glass p-4 rounded-lg hover:border-cyan transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">⚡</span>
                                <div className="text-left">
                                    <div className="font-semibold group-hover:text-cyan transition-colors">About</div>
                                    <div className="text-sm text-gray-400">Learn our philosophy</div>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/work"
                            className="glass p-4 rounded-lg hover:border-cyan transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">🎯</span>
                                <div className="text-left">
                                    <div className="font-semibold group-hover:text-cyan transition-colors">Work</div>
                                    <div className="text-sm text-gray-400">See our results</div>
                                </div>
                            </div>
                        </Link>

                        <Link
                            href="/contact"
                            className="glass p-4 rounded-lg hover:border-cyan transition-all duration-300 group"
                        >
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">📧</span>
                                <div className="text-left">
                                    <div className="font-semibold group-hover:text-cyan transition-colors">Contact</div>
                                    <div className="text-sm text-gray-400">Get in touch</div>
                                </div>
                            </div>
                        </Link>
                    </div>
                </motion.div>

                {/* Action Buttons */}
                <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.6 }}
                >
                    <button
                        onClick={() => router.back()}
                        className="px-8 py-4 rounded-lg glass hover:border-cyan transition-all duration-300 font-semibold"
                    >
                        ← Go Back
                    </button>
                    <Link
                        href="/"
                        className="px-8 py-4 rounded-lg bg-gradient-to-r from-cyan to-purple text-white font-semibold hover:shadow-lg hover:shadow-purple/50 transition-all duration-300"
                    >
                        Go to Homepage
                    </Link>
                </motion.div>

                {/* Fun Engineering Message */}
                <motion.div
                    className="mt-12 p-4 rounded-lg bg-cyan/10 border border-cyan/20"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.8 }}
                >
                    <p className="text-sm text-cyan">
                        <span className="font-mono">Error Code:</span> HTTP 404 |
                        <span className="font-mono"> Status:</span> Resource Not Found |
                        <span className="font-mono"> Solution:</span> Navigate to existing route
                    </p>
                </motion.div>
            </div>
        </main>
    );
}
