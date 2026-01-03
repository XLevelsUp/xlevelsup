'use client';

import { motion } from 'framer-motion';
import Form from '../ui/Form';

export default function Contact() {
    return (
        <section className="py-24 px-4" id="contact">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    className="text-center mb-12"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <h2 className="text-4xl md:text-5xl font-bold mb-4">
                        Ready to <span className="gradient-text">Level Up?</span>
                    </h2>
                    <p className="text-gray-400 text-lg">
                        Let's discuss how we can accelerate your growth
                    </p>
                </motion.div>

                <motion.div
                    className="glass p-8 md:p-12 rounded-2xl"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <Form />
                </motion.div>

                <motion.div
                    className="mt-12 text-center text-gray-400"
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <p className="mb-4">Or reach us directly:</p>
                    <div className="flex flex-col md:flex-row justify-center gap-6">
                        <a
                            href="mailto:hello@xlevelsup.com"
                            className="hover:text-cyan transition-colors"
                        >
                            📧 hello@xlevelsup.com
                        </a>
                        <a
                            href="tel:+1234567890"
                            className="hover:text-cyan transition-colors"
                        >
                            📞 +1 (234) 567-890
                        </a>
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
