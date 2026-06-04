import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Website Development & eCommerce Stores India | XLEVELSUP',
    description: 'XLEVELSUP builds high-performance marketing websites and eCommerce stores on Next.js — engineered for speed, conversion, and Lighthouse 95+ scores. Your brand\'s digital home, built to scale.',
    keywords: [
        'eCommerce Website Development India',
        'Next.js Website Development',
        'Marketing Website Coimbatore',
        'Web Design Agency India',
        'Website Development Company Coimbatore',
        'eCommerce Development Coimbatore',
        'XLEVELSUP',
    ],
};

export default function MarketingArchitectureLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
