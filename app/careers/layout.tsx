import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Careers at XLEVELSUP | Build the Future of Software',
    description: 'We are hiring Senior Software Engineers, AI Automation Engineers, and Digital Growth Specialists. Help build end-to-end tech solutions for scale.',
    keywords: [
        'Software Engineer Jobs Coimbatore',
        'Full-Stack Developer Jobs India',
        'AI Engineer India',
        'Tech Startup Jobs',
        'Remote Engineering Jobs',
    ],
};

export default function CareersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
