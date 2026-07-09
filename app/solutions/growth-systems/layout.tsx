import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Google Ads, Server-Side Tracking & Performance Marketing | XLEVELSUP',
    description: 'XLEVELSUP manages Google Ads campaigns, implements server-side conversion tracking, and builds data-driven growth systems to lower your CAC and maximise ROAS.',
    alternates: {
        canonical: '/solutions/growth-systems',
    },
    keywords: [
        'Google Ads Management Coimbatore',
        'Google Ads Agency India',
        'PPC Management India',
        'Server-Side Conversion Tracking',
        'Performance Marketing',
        'ROAS Optimization',
        'Facebook Ads Management',
        'XLEVELSUP',
    ],
};

export default function GrowthSystemsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
