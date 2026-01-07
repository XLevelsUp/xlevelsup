'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import Button from '../ui/Button';

export default function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSolutionsOpen, setIsSolutionsOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const solutions = [
        { name: 'Marketing Architecture', href: '/solutions/marketing-architecture' },
        { name: 'Growth Systems', href: '/solutions/growth-systems' },
        { name: 'Search Engineering', href: '/solutions/search-engineering' },
        { name: 'AI & Automation', href: '/solutions/ai-automation' },
    ];

    const scrollToContact = () => {
        const contactSection = document.getElementById('contact');
        if (contactSection) {
            contactSection.scrollIntoView({ behavior: 'smooth' });
        } else {
            window.location.href = '/#contact';
        }
        setIsMobileMenuOpen(false);
    };

    return (
        <nav
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass shadow-lg' : 'bg-transparent'
                }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center">
                        <span className="hidden sm:block text-2xl font-bold tracking-wider gradient-text">
                            XLEVELSUP
                        </span>
                        <span className="block sm:hidden text-2xl font-bold tracking-wider gradient-text">
                            XLU
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link
                            href="/"
                            className="text-gray-300 hover:text-white transition-colors duration-200"
                        >
                            Home
                        </Link>

                        {/* Solutions Dropdown */}
                        <div
                            className="relative"
                            onMouseEnter={() => setIsSolutionsOpen(true)}
                            onMouseLeave={() => setIsSolutionsOpen(false)}
                        >
                            <button className="text-gray-300 hover:text-white transition-colors duration-200 flex items-center gap-1">
                                Solutions
                                <svg
                                    className={`w-4 h-4 transition-transform duration-200 ${isSolutionsOpen ? 'rotate-180' : ''
                                        }`}
                                    fill="none"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path d="M19 9l-7 7-7-7"></path>
                                </svg>
                            </button>

                            <AnimatePresence>
                                {isSolutionsOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        transition={{ duration: 0.2 }}
                                        className="absolute top-full left-0 mt-2 w-64 glass rounded-lg shadow-xl overflow-hidden"
                                    >
                                        {solutions.map((solution, index) => (
                                            <Link
                                                key={solution.href}
                                                href={solution.href}
                                                className="block px-6 py-3 text-gray-300 hover:text-white hover:bg-dark-700/50 transition-colors duration-200"
                                            >
                                                {solution.name}
                                            </Link>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <Link
                            href="/work"
                            className="text-gray-300 hover:text-white transition-colors duration-200"
                        >
                            Work
                        </Link>

                        <Link
                            href="/about"
                            className="text-gray-300 hover:text-white transition-colors duration-200"
                        >
                            About
                        </Link>

                        <Button
                            onClick={scrollToContact}
                            variant="secondary"
                            className="!px-6 !py-2 text-sm"
                        >
                            Get Growth Audit
                        </Button>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden text-white p-2"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
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
                            {isMobileMenuOpen ? (
                                <path d="M6 18L18 6M6 6l12 12"></path>
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16"></path>
                            )}
                        </svg>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="md:hidden glass border-t border-gray-800"
                    >
                        <div className="px-4 py-6 space-y-4">
                            <Link
                                href="/"
                                className="block text-gray-300 hover:text-white transition-colors duration-200"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Home
                            </Link>

                            {/* Mobile Solutions Submenu */}
                            <div>
                                <button
                                    onClick={() => setIsSolutionsOpen(!isSolutionsOpen)}
                                    className="w-full flex items-center justify-between text-gray-300 hover:text-white transition-colors duration-200"
                                >
                                    Solutions
                                    <svg
                                        className={`w-4 h-4 transition-transform duration-200 ${isSolutionsOpen ? 'rotate-180' : ''
                                            }`}
                                        fill="none"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path d="M19 9l-7 7-7-7"></path>
                                    </svg>
                                </button>

                                <AnimatePresence>
                                    {isSolutionsOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="ml-4 mt-2 space-y-2"
                                        >
                                            {solutions.map((solution) => (
                                                <Link
                                                    key={solution.href}
                                                    href={solution.href}
                                                    className="block text-gray-400 hover:text-white transition-colors duration-200"
                                                    onClick={() => setIsMobileMenuOpen(false)}
                                                >
                                                    {solution.name}
                                                </Link>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <Link
                                href="/work"
                                className="block text-gray-300 hover:text-white transition-colors duration-200"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                Work
                            </Link>

                            <Link
                                href="/about"
                                className="block text-gray-300 hover:text-white transition-colors duration-200"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                About
                            </Link>

                            <Button
                                onClick={scrollToContact}
                                variant="primary"
                                className="w-full !py-3"
                            >
                                Get Growth Audit
                            </Button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
