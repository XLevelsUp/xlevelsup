'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import Button from './ui/Button';
import { captureLead, type CaptureLeadResult } from '@/actions/capture-lead';

// Submit button component with loading state
function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <Button type="submit" variant="primary" className="w-full" disabled={pending}>
            {pending ? (
                <span className="flex items-center justify-center gap-2">
                    <svg
                        className="animate-spin h-5 w-5"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                    >
                        <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                        ></circle>
                        <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                    </svg>
                    Submitting...
                </span>
            ) : (
                'Submit'
            )}
        </Button>
    );
}

export default function ContactForm() {
    const router = useRouter();
    const [isSuccess, setIsSuccess] = useState(false);

    // Controlled form inputs to preserve data on error
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        service: '',
    });

    // useFormState requires action with signature: (state, formData) => Promise<state>
    const [state, formAction] = useFormState(
        async (prevState: CaptureLeadResult, formData: FormData) => {
            return await captureLead(formData);
        },
        { success: false }
    );

    const services = [
        'High-Performance Websites',
        'Scalable eCommerce Apps',
        'Data-Driven Ad Campaigns',
        'Growth Engineering',
        'AI & Automation',
    ];

    // Handle input changes to preserve form data
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Handle successful submission
    useEffect(() => {
        if (state.success && !isSuccess) {
            setIsSuccess(true);

            // Show success toast
            toast.success('Success! Redirecting to booking...', {
                duration: 3000,
                position: 'top-center',
                style: {
                    background: '#0a0a0a',
                    color: '#fff',
                    border: '1px solid #00ffff',
                },
            });

            // Wait 1.5 seconds for user to see success, then redirect
            setTimeout(() => {
                window.open('https://cal.com/pranesh-s-zomkol/growth-audit', '_blank');
            }, 1500);
        }
    }, [state.success, isSuccess]);

    // Show error toast if submission failed (form data is preserved)
    // Only show error if there's an error AND we haven't succeeded
    useEffect(() => {
        if (state.error && !state.success) {
            toast.error(state.error, {
                duration: 4000,
                position: 'top-center',
                style: {
                    background: '#0a0a0a',
                    color: '#fff',
                    border: '1px solid #ff0000',
                },
            });
        }
    }, [state.error, state.success]);

    return (
        <AnimatePresence mode="wait">
            {!isSuccess ? (
                <motion.form
                    key="form"
                    action={formAction}
                    className="space-y-6"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium mb-2">
                            Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:border-cyan transition-colors"
                            placeholder="Your full name"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="email" className="block text-sm font-medium mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:border-cyan transition-colors"
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="phone" className="block text-sm font-medium mb-2">
                            Phone *
                        </label>
                        <input
                            type="tel"
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:border-cyan transition-colors"
                            placeholder="+91 98765 43210"
                            required
                        />
                    </div>

                    <div>
                        <label htmlFor="service" className="block text-sm font-medium mb-2">
                            Service Interested In *
                        </label>
                        <select
                            id="service"
                            name="service"
                            value={formData.service}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:border-cyan transition-colors"
                            required
                        >
                            <option value="">Select a service</option>
                            {services.map((service) => (
                                <option key={service} value={service}>
                                    {service}
                                </option>
                            ))}
                        </select>
                    </div>

                    <SubmitButton />
                </motion.form>
            ) : (
                <motion.div
                    key="success"
                    className="text-center py-12"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                >
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-cyan to-purple flex items-center justify-center">
                        <svg
                            className="w-10 h-10 text-white"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold mb-2 gradient-text">Success!</h3>
                    <p className="text-gray-300">Redirecting to booking page...</p>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
