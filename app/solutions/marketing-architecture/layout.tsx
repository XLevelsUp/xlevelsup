import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Product Engineering & Web App Development | XLEVELSUP',
    description: 'We architect and build custom Next.js web apps, headless eCommerce platforms, and scalable cloud infrastructure engineered for 100/100 Core Web Vitals and business growth.',
    keywords: [
        'Custom Software Development',
        'Next.js Web App',
        'Headless eCommerce',
        'Full-Stack Engineering',
        'Cloud Architecture',
    ],
};

export default function MarketingArchitectureLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
