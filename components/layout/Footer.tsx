'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="bg-dark-900 border-t border-gray-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Main Footer Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
                    {/* Column 1: Brand Info */}
                    <div>
                        {/* <h3 className="text-2xl font-bold tracking-wider gradient-text mb-4">
                            XLEVELSUP
                        </h3> */}
                        <Image src="/xlevelsup_logo_footer.svg" width={155} height={24} alt="XLEVELSUP logo — Custom Software Development & AI Automation Company India" className="mb-4" />
                        <p className="text-gray-400 leading-relaxed">
                            Engineering X Times More Growth.
                        </p>
                        <p className="text-gray-400 text-sm mt-4">
                            Engineering the digital infrastructure, custom software, and algorithmic growth systems that scale modern businesses.
                        </p>
                    </div>

                    {/* Column 2: Solutions */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Solutions</h3>
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
                                    href="/solutions/search-engineering"
                                    className="text-gray-400 hover:text-cyan transition-colors duration-200"
                                >
                                    Search Engineering
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/solutions/digital-marketing"
                                    className="text-gray-400 hover:text-cyan transition-colors duration-200"
                                >
                                    Digital Marketing
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
                                    href="/solutions/ai-automation"
                                    className="text-gray-400 hover:text-cyan transition-colors duration-200"
                                >
                                    AI & Automation
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Company */}
                    <div>
                        <h3 className="text-white font-semibold mb-4">Company</h3>
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
                                    href="/careers"
                                    className="text-gray-400 hover:text-cyan transition-colors duration-200"
                                >
                                    Careers
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
                        <h3 className="text-white font-semibold mb-4">Connect</h3>

                        {/* Social Icons Placeholder */}
                        <div className="flex gap-4 mb-6">
                            <a
                                href="https://www.linkedin.com/company/xlevelsup"
                                className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-cyan transition-colors duration-200"
                                aria-label="LinkedIn"
                                target='_blank'
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                            </a>
                            <a
                                href="https://www.instagram.com/xlevelsup"
                                className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-cyan transition-colors duration-200"
                                aria-label="Instagram"
                                target='_blank'
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1112.324 0 6.162 6.162 0 01-12.324 0zM12 16a4 4 0 100-8 4 4 0 000 8zm4.965-10.322a1.44 1.44 0 110.002-2.88 1.44 1.44 0 01-.002 2.88z" />
                                </svg>
                            </a>
                            <a
                                href="https://x.com/xlevelsup"
                                className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-cyan transition-colors duration-200"
                                aria-label="X (Twitter)"
                                target="_blank"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                                </svg>
                            </a>
                            <a
                                href="https://www.facebook.com/xlevelsup"
                                className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-cyan transition-colors duration-200"
                                aria-label="Facebook"
                                target="_blank"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
                                </svg>
                            </a>
                            <a
                                href="https://www.youtube.com/@xlevelsup"
                                className="w-10 h-10 rounded-full glass flex items-center justify-center hover:border-cyan transition-colors duration-200"
                                aria-label="YouTube"
                                target="_blank"
                            >
                                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                </svg>
                            </a>

                        </div>

                        {/* Local SEO Address */}
                        <div className="text-gray-400 text-sm">
                            <p className="font-semibold text-white mb-1">Location</p>
                            <p>NO 178, 3rd Floor A Rammachnadra Road,</p>
                            <p>RS Puram, Coimbatore - 641002,</p>
                            <p> Tamil Nadu, India</p>
                        </div>
                    </div>
                </div>

                {/* Gradient Divider */}
                <div className="h-px bg-linear-to-r from-transparent via-cyan/50 to-transparent mb-8"></div>

                {/* Copyright */}
                <div className="text-center text-white/50 text-sm">
                    <p>
                        © {currentYear} XLEVELSUP. Built with Next.js & Passion.
                    </p>
                </div>
            </div>
        </footer>
    );
}
