import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Technical SEO & Programmatic Search Engineering | XLEVELSUP',
    description: 'XLEVELSUP engineers programmatic SEO systems and technical search infrastructure to capture organic traffic at scale. Built for businesses that want compounding, defensible search visibility.',
    keywords: [
        'SEO Agency Coimbatore',
        'Technical SEO Company India',
        'SEO Services Coimbatore',
        'Technical SEO Agency',
        'Programmatic SEO',
        'Technical SEO Audit',
        'Schema Markup',
        'Organic Growth Strategy',
        'XLEVELSUP',
    ],
};

export default function SearchEngineeringLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
