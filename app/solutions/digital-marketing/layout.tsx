import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Social Media Management, Meta Ads & Content Creation | XLEVELSUP',
    description: 'XLEVELSUP manages your social media, creates high-performing ad creatives, and runs Meta Ads campaigns engineered to drive measurable revenue growth for your brand.',
    alternates: {
        canonical: '/solutions/digital-marketing',
    },
    keywords: [
        'Social Media Management Coimbatore',
        'Meta Ads Agency India',
        'Instagram Marketing Agency',
        'Content Creation Agency India',
        'Instagram Reels Marketing',
        'Digital Marketing Agency Coimbatore',
        'Video Marketing Services',
        'XLEVELSUP',
    ],
};

export default function DigitalMarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
