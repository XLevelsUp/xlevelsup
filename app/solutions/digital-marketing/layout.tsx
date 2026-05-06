import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Digital Marketing & Meta Ads | XLevelsUp',
    description: 'Performance-driven digital marketing and Meta Ads management to drive measurable revenue growth for your brand.',
    keywords: [
        'Digital Marketing Agency Coimbatore',
        'Social Media Management',
        'Meta Ads Agency',
        'Video Marketing Services',
        'Content Creation Studio',
    ],
};

export default function DigitalMarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
