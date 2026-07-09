import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Our Work | Engineered Results & Client Case Studies | XLEVELSUP',
    description: 'Explore XLEVELSUP\'s portfolio — real projects with measurable outcomes across eCommerce, brand design, ERP/SaaS, and digital presence for businesses across industries.',
    keywords: [
        'XLEVELSUP Portfolio',
        'Web Development Case Studies India',
        'eCommerce Projects Coimbatore',
        'Client Work XLEVELSUP',
    ],
    alternates: {
        canonical: '/work',
    },
};

export default function WorkLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
