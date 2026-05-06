import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Performance Marketing & Growth Systems | XLevelsUp',
    description: 'Data-driven performance marketing and growth systems to lower CAC and maximize ROAS for your business.',
    keywords: [
        'Performance Marketing',
        'Google Ads Management',
        'Facebook Ads Management',
        'ROAS Optimization',
        'Marketing Automation',
    ],
};

export default function GrowthSystemsLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
