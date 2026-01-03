'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Button from './Button';
import { FormData } from '@/types';

interface FormProps {
    onSubmit?: (data: FormData) => void;
}

export default function Form({ onSubmit }: FormProps) {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        email: '',
        businessUrl: '',
        service: '',
    });

    const [errors, setErrors] = useState<Partial<FormData>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);

    const services = [
        'High-Performance Websites',
        'Scalable eCommerce Apps',
        'Data-Driven Ad Campaigns',
        'Growth Engineering',
    ];

    const validateEmail = (email: string) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    };

    const validateForm = (): boolean => {
        const newErrors: Partial<FormData> = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.businessUrl.trim()) {
            newErrors.businessUrl = 'Business URL is required';
        }

        if (!formData.service) {
            newErrors.service = 'Please select a service';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            if (onSubmit) {
                onSubmit(formData);
            }
            setIsSubmitted(true);

            // Reset form after 3 seconds
            setTimeout(() => {
                setFormData({ name: '', email: '', businessUrl: '', service: '' });
                setIsSubmitted(false);
            }, 3000);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        // Clear error when user starts typing
        if (errors[name as keyof FormData]) {
            setErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    if (isSubmitted) {
        return (
            <motion.div
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
                <p className="text-gray-300">We will analyze your stack and contact you shortly.</p>
            </motion.div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                />
                {errors.name && <p className="text-red-400 text-sm mt-1">{errors.name}</p>}
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
                />
                {errors.email && <p className="text-red-400 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
                <label htmlFor="businessUrl" className="block text-sm font-medium mb-2">
                    Business URL *
                </label>
                <input
                    type="text"
                    id="businessUrl"
                    name="businessUrl"
                    value={formData.businessUrl}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:border-cyan transition-colors"
                    placeholder="https://yourbusiness.com"
                />
                {errors.businessUrl && <p className="text-red-400 text-sm mt-1">{errors.businessUrl}</p>}
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
                >
                    <option value="">Select a service</option>
                    {services.map((service) => (
                        <option key={service} value={service}>
                            {service}
                        </option>
                    ))}
                </select>
                {errors.service && <p className="text-red-400 text-sm mt-1">{errors.service}</p>}
            </div>

            <Button type="submit" variant="primary" className="w-full">
                Submit
            </Button>
        </form>
    );
}
