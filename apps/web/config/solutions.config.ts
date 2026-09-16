export interface ProcessStep {
    number: number;
    title: string;
    description: string;
}

export interface Benefit {
    icon: string;
    title: string;
    description: string;
}

export interface Solution {
    slug: string;
    title: string;
    subtitle: string;
    techStack: string[];
    processSteps: ProcessStep[];
    benefits: Benefit[];
}

export const solutions: Solution[] = [
    {
        slug: 'marketing-architecture',
        title: 'Marketing Architecture',
        subtitle: 'High-performance websites engineered for conversion and built to scale.',
        techStack: ['Next.js', 'React', 'TypeScript', 'Tailwind CSS', 'Framer Motion', 'Vercel'],
        processSteps: [
            {
                number: 1,
                title: 'Audit',
                description: 'Analyze your current website performance, user flows, and conversion bottlenecks. Identify technical debt and optimization opportunities.',
            },
            {
                number: 2,
                title: 'Engineer',
                description: 'Build a modern, high-performance website using cutting-edge frameworks. Optimize for speed, SEO, and user experience from the ground up.',
            },
            {
                number: 3,
                title: 'Scale',
                description: 'Deploy with confidence. Monitor performance metrics, iterate based on data, and continuously optimize for growth.',
            },
        ],
        benefits: [
            {
                icon: '⚡',
                title: 'Lightning Fast',
                description: '95+ Lighthouse scores with optimized code splitting and lazy loading.',
            },
            {
                icon: '🎯',
                title: 'Conversion Optimized',
                description: 'Every element designed to guide users toward your business goals.',
            },
            {
                icon: '📱',
                title: 'Mobile First',
                description: 'Responsive design that works flawlessly across all devices.',
            },
            {
                icon: '🔍',
                title: 'SEO Engineered',
                description: 'Built-in SEO best practices for maximum organic visibility.',
            },
        ],
    },
    {
        slug: 'growth-systems',
        title: 'Growth Systems',
        subtitle: 'Scalable eCommerce platforms and custom web applications engineered for revenue generation.',
        techStack: ['Shopify', 'Next.js', 'Node.js', 'PostgreSQL', 'Stripe', 'AWS'],
        processSteps: [
            {
                number: 1,
                title: 'Audit',
                description: 'Evaluate your current eCommerce setup, payment flows, and customer journey. Identify friction points and revenue leaks.',
            },
            {
                number: 2,
                title: 'Engineer',
                description: 'Build or optimize your eCommerce platform with focus on performance, security, and scalability. Integrate payment systems and analytics.',
            },
            {
                number: 3,
                title: 'Scale',
                description: 'Implement growth strategies, A/B testing, and conversion rate optimization. Scale infrastructure as your business grows.',
            },
        ],
        benefits: [
            {
                icon: '💰',
                title: 'Revenue Focused',
                description: 'Every feature engineered to maximize customer lifetime value.',
            },
            {
                icon: '🔒',
                title: 'Secure & Compliant',
                description: 'PCI-compliant payment processing and data security built-in.',
            },
            {
                icon: '📊',
                title: 'Analytics Driven',
                description: 'Real-time insights into sales, conversions, and customer behavior.',
            },
            {
                icon: '🚀',
                title: 'Infinitely Scalable',
                description: 'Architecture that grows with your business, from startup to enterprise.',
            },
        ],
    },
    {
        slug: 'search-engineering',
        title: 'Search Engineering',
        subtitle: 'Data-driven SEO strategies and paid advertising campaigns that deliver measurable ROI.',
        techStack: ['Google Ads', 'Google Analytics 4', 'Search Console', 'SEMrush', 'Ahrefs', 'Meta Ads'],
        processSteps: [
            {
                number: 1,
                title: 'Audit',
                description: 'Comprehensive analysis of your current search presence, keyword rankings, and ad performance. Identify quick wins and long-term opportunities.',
            },
            {
                number: 2,
                title: 'Engineer',
                description: 'Develop data-driven SEO strategy and launch optimized ad campaigns. Implement tracking, conversion pixels, and analytics infrastructure.',
            },
            {
                number: 3,
                title: 'Scale',
                description: 'Continuously optimize campaigns based on performance data. Scale winning strategies and cut underperforming channels.',
            },
        ],
        benefits: [
            {
                icon: '📈',
                title: 'Measurable ROI',
                description: 'Track every dollar spent and revenue generated with precision.',
            },
            {
                icon: '🎯',
                title: 'Targeted Reach',
                description: 'Reach your ideal customers at the right time with the right message.',
            },
            {
                icon: '🔄',
                title: 'Continuous Optimization',
                description: 'Weekly performance reviews and campaign adjustments for maximum efficiency.',
            },
            {
                icon: '📊',
                title: 'Full Transparency',
                description: 'Real-time dashboards showing exactly where your budget goes.',
            },
        ],
    },
];

export function getSolutionBySlug(slug: string): Solution | undefined {
    return solutions.find((solution) => solution.slug === slug);
}
