import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Tech-Driven Digital Marketing & Video Ads | XLEVELSUP',
    description: 'We partner with premium studios to shoot high-retention content, then use algorithmic distribution and Meta Ads to turn viewers into revenue.',
    keywords: [
        'Digital Marketing Agency Chennai',
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
