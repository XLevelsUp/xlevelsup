import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Modern Web Architecture & eCommerce Development | XLEVELSUP',
    description: 'We replace slow WordPress sites with high-speed Next.js and Headless Shopify architectures. Engineered for 100/100 Core Web Vitals and higher conversion rates.',
    keywords: [
        'Next.js Development',
        'Headless Shopify',
        'Custom Web Apps',
        'React Developers',
        'Site Speed Optimization',
    ],
};

export default function MarketingArchitectureLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
