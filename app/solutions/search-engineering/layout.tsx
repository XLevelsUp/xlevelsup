import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Technical SEO & Programmatic Search Engineering | XLEVELSUP',
    description: 'Dominate search intent with Programmatic SEO and Schema markup. We build content engines that capture traffic at scale.',
    keywords: [
        'Programmatic SEO',
        'Technical SEO Audit',
        'Schema Markup',
        'Organic Growth Strategy',
    ],
};

export default function SearchEngineeringLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
