import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Careers at XLEVELSUP | Join the Growth Engineers',
    description: 'We are hiring Senior Engineers, Performance Marketers, and Creative Designers. Help us redefine how businesses grow.',
    keywords: [
        'Tech Jobs Chennai',
        'Marketing Jobs',
        'React Developer Jobs',
        'Remote Startups',
    ],
};

export default function CareersLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
