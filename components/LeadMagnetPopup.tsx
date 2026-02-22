'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import toast from 'react-hot-toast';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { captureEmailLead, type CaptureEmailResult } from '@/actions/capture-email-lead';

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
                'Claim My Free Audit'
            )}
        </Button>
    );
}

export default function LeadMagnetPopup() {
    const [showPopup, setShowPopup] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // useActionState for server action integration
    const [state, formAction] = useActionState(
        async (prevState: CaptureEmailResult, formData: FormData) => {
            return await captureEmailLead(formData);
        },
        { success: false }
    );

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

    // Handle successful submission
    useEffect(() => {
        if (state.success && !isSuccess) {
            setIsSuccess(true);

            // Show success toast
            toast.success('Email saved! Opening booking page...', {
                duration: 3000,
                position: 'top-center',
                style: {
                    background: '#0a0a0a',
                    color: '#fff',
                    border: '1px solid #00ffff',
                },
            });

            // Wait 1.5 seconds, then open booking page and close popup
            setTimeout(() => {
                window.open('https://cal.com/pranesh-s-zomkol/growth-audit', '_blank');
                setShowPopup(false);
            }, 1500);
        }
    }, [state.success, isSuccess]);

    // Show error toast if submission failed
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

    const handleClose = () => {
        setShowPopup(false);
    };

    return (
        <Modal isOpen={showPopup} onClose={handleClose} title="🎁 Free SEO Audit">
            {!isSuccess ? (
                <div>
                    <p className="text-gray-300 mb-6 leading-relaxed">
                        Want a <span className="gradient-text font-semibold">Free SEO Audit</span>?
                        Enter your email to book a 15-min strategy call with our experts.
                    </p>

                    <form action={formAction} className="space-y-4">
                        <input
                            type="email"
                            name="email"
                            placeholder="your@email.com"
                            required
                            className="w-full px-4 py-3 rounded-lg glass focus:outline-none focus:border-cyan transition-colors"
                        />
                        <SubmitButton />
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
                    <p className="text-gray-300">Opening booking page...</p>
                </div>
            )}
        </Modal>
    );
}
