import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Data-Driven Performance Marketing & Ad Systems | XLEVELSUP',
    description: 'Lower your CAC with server-side tracking (CAPI) and automated CRM funnels. We engineer ad strategies based on data, not gut feelings.',
    keywords: [
        'Facebook CAPI Setup',
        'Performance Marketing',
        'ROAS Optimization',
        'Google Ads Management',
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
