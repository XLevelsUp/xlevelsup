'use client';

import { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';

export default function LeadMagnetPopup() {
    const [showPopup, setShowPopup] = useState(false);
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);

    useEffect(() => {
        // Check if user has already seen the popup in this session
        const hasSeenPopup = sessionStorage.getItem('leadMagnetSeen');

        if (!hasSeenPopup) {
            // Set timer for 10 seconds
            const timer = setTimeout(() => {
                setShowPopup(true);
                sessionStorage.setItem('leadMagnetSeen', 'true');
            }, 10000); // 10 seconds

            return () => clearTimeout(timer);
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (email.trim()) {
            setIsSubmitted(true);
            setTimeout(() => {
                setShowPopup(false);
            }, 2000);
        }
    };

    const handleClose = () => {
        setShowPopup(false);
    };

    return (
        <Modal isOpen={showPopup} onClose={handleClose} title="🎁 Free SEO Audit">
            {!isSubmitted ? (
                <div>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                        Want a <span className="gradient-text font-semibold">Free SEO Audit</span>?
                        Enter your email to book a 15-min strategy call with our experts.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your@email.com"
                            required
                            className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:border-cyan transition-colors"
                        />
                        <Button type="submit" variant="primary" className="w-full">
                            Claim My Free Audit
                        </Button>
                    </form>

                    <p className="text-xs text-gray-500 mt-4 text-center">
                        No spam. Unsubscribe anytime.
                    </p>
                </div>
            ) : (
                <div className="text-center py-6">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-cyan to-purple flex items-center justify-center">
                        <svg
                            className="w-8 h-8 text-white"
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
                    <h3 className="text-xl font-bold gradient-text mb-2">Thank You!</h3>
                    <p className="text-gray-300">We'll be in touch shortly.</p>
                </div>
            )}
        </Modal>
    );
}
