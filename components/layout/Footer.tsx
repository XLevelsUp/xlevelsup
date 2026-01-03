'use client';

import Link from 'next/link';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-dark-900 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Main Footer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Column 1: Brand Info */}
                    <div>
                        <h3 className="text-2xl font-bold tracking-wider gradient-text mb-4">
                            XLEVELSUP
                        </h3>
                        <p className="text-gray-400 leading-relaxed">
                            Engineering X Times More Growth.
                        </p>
                        <p className="text-gray-500 text-sm mt-4">
                            Tech-driven marketing company focused on measurable business growth.
                        </p>
                    </div>

                    {/* Column 2: Solutions */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Solutions</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/solutions/marketing-architecture"
                                    className="text-gray-400 hover:text-cyan transition-colors duration-200"
                                >
                                    Marketing Architecture
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/solutions/growth-systems"
                                    className="text-gray-400 hover:text-cyan transition-colors duration-200"
                                >
                                    Growth Systems
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/solutions/search-engineering"
                                    className="text-gray-400 hover:text-cyan transition-colors duration-200"
                                >
                                    Search Engineering
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Company */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Company</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link
                                    href="/about"
                                    className="text-gray-400 hover:text-cyan transition-colors duration-200"
                                >
                                    About
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/work"
                                    className="text-gray-400 hover:text-cyan transition-colors duration-200"
                                >
                                    Work
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/contact"
                                    className="text-gray-400 hover:text-cyan transition-colors duration-200"
                                >
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/privacy"
                                    className="text-gray-400 hover:text-cyan transition-colors duration-200"
                                >
                                    Privacy Policy
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Connect */}
                    <div>
                        <h4 className="text-white font-semibold mb-4">Connect</h4>

                        {/* Social Icons Placeholder */}
                        <div className="flex gap-4 mb-6">
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-cyan transition-colors duration-200"
                                aria-label="LinkedIn"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-cyan transition-colors duration-200"
                                aria-label="Twitter"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2c9 5 20 0 20-11.5a4.5 4.5 0 00-.08-.83A7.72 7.72 0 0023 3z"></path>
                                </svg>
                            </a>
                            <a
                                href="#"
                                className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-cyan transition-colors duration-200"
                                aria-label="GitHub"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                </svg>
                            </a>
                        </div>

                        {/* Local SEO Address */}
                        <div className="text-gray-400 text-sm">
                            <p className="font-semibold text-white mb-1">Location</p>
                            <p>Chennai, Tamil Nadu</p>
                            <p>India</p>
                        </div>
                    </div>
                </div>

                {/* Gradient Divider */}
                <div className="h-px bg-gradient-to-r from-transparent via-cyan/50 to-transparent mb-8"></div>

                {/* Copyright */}
                <div className="text-center text-gray-500 text-sm">
                    <p>
                        © {currentYear} XLEVELSUP. Built with Next.js & Passion.
                    </p>
                </div>
            </div>
        </footer>
    );
}
