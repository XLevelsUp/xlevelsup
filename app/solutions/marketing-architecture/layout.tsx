import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Marketing Architecture & Strategy | XLevelsUp Agency',
    description: 'Strategic marketing architecture and planning by XLevelsUp to build scalable growth systems for your brand.',
    keywords: [
        'Marketing Strategy',
        'Digital Marketing Planning',
        'Marketing Architecture',
        'Growth Systems Design',
        'Marketing Technology Stack',
    ],
};

export default function MarketingArchitectureLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
