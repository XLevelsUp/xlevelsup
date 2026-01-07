'use client';

import { motion } from 'framer-motion';

// Job data structure
interface Job {
    id: number;
    title: string;
    category: 'growth' | 'product' | 'creative';
    tag: string;
    description: string;
    experience: string;
    linkedinUrl: string;
}

// Jobs data - easily updatable
const JOBS_DATA: Job[] = [
    // GROWTH ENGINEERING TRACK
    {
        id: 1,
        title: 'Senior Marketing Engineer',
        category: 'growth',
        tag: 'Hybrid',
        description: "You aren't just a marketer. You understand pixels, CAPI, and ROAS logic. Lead our high-budget ad campaigns and architect the funnel strategy for enterprise clients.",
        experience: '5+ Years',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    {
        id: 2,
        title: 'Performance Marketing Engineer',
        category: 'growth',
        tag: 'Remote',
        description: 'Execute precision ad campaigns on Meta & Google. You live in Ads Manager and obsess over lowering CAC while maintaining creative excellence.',
        experience: '2+ Years',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    {
        id: 3,
        title: 'Growth Associate (Marketing)',
        category: 'growth',
        tag: 'Hybrid',
        description: 'The entry point. You will learn the XLU system—SEO, Content, and Ad Operations. Fast-paced execution required.',
        experience: 'Fresher / 1 Year',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    // PRODUCT & AI TRACK
    {
        id: 4,
        title: 'Senior Software Engineer (Full Stack)',
        category: 'product',
        tag: 'Hybrid',
        description: 'Architect scalable web apps. You own the stack (React/Vue/Node). You care about render cycles, state management, and shipping bug-free code.',
        experience: '4+ Years',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    {
        id: 5,
        title: 'Mobile Engineer (Flutter)',
        category: 'product',
        tag: 'Remote',
        description: 'Build cross-platform eCommerce apps that feel native. You will translate our web architectures into fluid mobile experiences using Flutter.',
        experience: '2+ Years',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    {
        id: 6,
        title: 'AI Automation Engineer',
        category: 'product',
        tag: 'Remote',
        description: "The X-Factor. Build Python scripts, integrate LLMs into workflows, and automate internal ops. If it can be automated, you build it.",
        experience: '2+ Years (Python/OpenAI API)',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    {
        id: 7,
        title: 'Software Engineer (Fresher/Entry)',
        category: 'product',
        tag: 'Hybrid',
        description: 'We hire for potential. You know React/JS basics and are hungry to learn modern engineering standards.',
        experience: 'Fresher',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    // CREATIVE ENGINEERING TRACK
    {
        id: 8,
        title: 'Product Designer (UI/UX)',
        category: 'creative',
        tag: 'Hybrid',
        description: 'Design the "X Experience." Create high-fidelity Figma prototypes for web & mobile apps. You understand user psychology and pixel-perfect design.',
        experience: '3+ Years',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    {
        id: 9,
        title: 'Video Engineer (Editor)',
        category: 'creative',
        tag: 'Remote',
        description: 'Create high-retention ad creatives and motion graphics. Speed + Storytelling. You ship video content that converts, not just looks pretty.',
        experience: '2+ Years',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
    {
        id: 10,
        title: 'Social Media & Content Manager',
        category: 'creative',
        tag: 'Hybrid',
        description: 'Own the XLU brand voice. Manage LinkedIn/Insta/Twitter organic growth. You write copy that resonates and build communities that engage.',
        experience: '1+ Years / Fresher',
        linkedinUrl: 'https://linkedin.com/company/xlevelsup/jobs',
    },
];

// Job Card Component
function JobCard({ job }: { job: Job }) {
    const glowColor = job.category === 'growth' ? 'purple' : job.category === 'product' ? 'cyan' : 'orange';

    return (
        <motion.div
            className={`glass p-6 rounded-xl transition-all duration-300 group hover:border-${glowColor}`}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -5 }}
        >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2 group-hover:text-white transition-colors">
                        {job.title}
                    </h3>
                    <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${job.category === 'growth'
                            ? 'bg-purple/20 text-purple border border-purple/30'
                            : job.category === 'product'
                                ? 'bg-cyan/20 text-cyan border border-cyan/30'
                                : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                            }`}>
                            {job.tag}
                        </span>
                        <span className="text-sm text-gray-400">{job.experience}</span>
                    </div>
                </div>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-sm leading-relaxed mb-6">
                {job.description}
            </p>

            {/* Apply Button */}
            <a
                href={job.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${job.category === 'growth'
                    ? 'bg-gradient-to-r from-purple to-pink-500 hover:shadow-lg hover:shadow-purple/50'
                    : job.category === 'product'
                        ? 'bg-gradient-to-r from-cyan to-blue-500 hover:shadow-lg hover:shadow-cyan/50'
                        : 'bg-gradient-to-r from-orange-500 to-pink-500 hover:shadow-lg hover:shadow-orange-500/50'
                    } text-white`}
            >
                Apply on LinkedIn
                <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
            </a>
        </motion.div>
    );
}

export default function CareersPage() {
    const growthJobs = JOBS_DATA.filter(job => job.category === 'growth');
    const productJobs = JOBS_DATA.filter(job => job.category === 'product');
    const creativeJobs = JOBS_DATA.filter(job => job.category === 'creative');

    return (
        <main className="min-h-screen py-24 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Hero Section */}
                <motion.div
                    className="text-center mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="inline-block mb-6">
                        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-cyan to-purple flex items-center justify-center text-4xl">
                            ⚙️
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-6">
                        Build the <span className="gradient-text">Machine</span>.
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto mb-12">
                        We don't hire employees. We hire engineers of growth. Join the team redefining how businesses scale.
                    </p>

                    {/* Stats */}
                    <div className="flex flex-wrap justify-center gap-8 glass p-6 rounded-2xl max-w-3xl mx-auto">
                        <div className="text-center">
                            <div className="text-3xl font-bold gradient-text mb-1">10</div>
                            <div className="text-sm text-gray-400">Open Positions</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold gradient-text mb-1">Coimbatore</div>
                            <div className="text-sm text-gray-400">HQ Location</div>
                        </div>
                        <div className="text-center">
                            <div className="text-3xl font-bold gradient-text mb-1">High-Performance</div>
                            <div className="text-sm text-gray-400">Culture</div>
                        </div>
                    </div>
                </motion.div>

                {/* Growth Engineering Track */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-1 w-12 bg-gradient-to-r from-purple to-pink-500 rounded-full"></div>
                        <h2 className="text-3xl font-bold">
                            Track 1: <span className="gradient-text">Growth Engineering</span>
                        </h2>
                    </div>
                    <p className="text-gray-400 mb-8 max-w-3xl">
                        Marketing roles for those who understand code, data, and conversion psychology.
                        You build campaigns like software—testable, scalable, optimized.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                        {growthJobs.map((job, index) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <JobCard job={job} />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Product & AI Track */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-1 w-12 bg-gradient-to-r from-cyan to-blue-500 rounded-full"></div>
                        <h2 className="text-3xl font-bold">
                            Track 2: <span className="gradient-text">Product & AI</span>
                        </h2>
                    </div>
                    <p className="text-gray-400 mb-8 max-w-3xl">
                        Engineering roles for builders who ship. You write clean code, care about performance,
                        and understand that every millisecond matters.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                        {productJobs.map((job, index) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <JobCard job={job} />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Creative Engineering Track */}
                <motion.div
                    className="mb-20"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full"></div>
                        <h2 className="text-3xl font-bold">
                            Track 3: <span className="gradient-text">Creative Engineering</span>
                        </h2>
                    </div>
                    <p className="text-gray-400 mb-8 max-w-3xl">
                        Design and content roles for those who blend creativity with execution.
                        You ship beautiful work that converts, not just looks good.
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                        {creativeJobs.map((job, index) => (
                            <motion.div
                                key={job.id}
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.5, delay: index * 0.1 }}
                            >
                                <JobCard job={job} />
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                {/* Culture Section */}
                <motion.div
                    className="text-center"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <div className="glass p-12 rounded-2xl max-w-4xl mx-auto relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-cyan/5 to-purple/5"></div>
                        <div className="relative z-10">
                            <h2 className="text-3xl font-bold mb-6">
                                What We <span className="gradient-text">Value</span>
                            </h2>
                            <div className="grid md:grid-cols-3 gap-6 text-left">
                                <div>
                                    <div className="text-2xl mb-2">⚡</div>
                                    <h3 className="font-bold mb-2">Execution Speed</h3>
                                    <p className="text-sm text-gray-400">Ship fast. Iterate faster. No endless meetings.</p>
                                </div>
                                <div>
                                    <div className="text-2xl mb-2">📊</div>
                                    <h3 className="font-bold mb-2">Data-Driven</h3>
                                    <p className="text-sm text-gray-400">Every decision backed by metrics, not opinions.</p>
                                </div>
                                <div>
                                    <div className="text-2xl mb-2">🎯</div>
                                    <h3 className="font-bold mb-2">Ownership</h3>
                                    <p className="text-sm text-gray-400">You own your domain. No micromanagement.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
