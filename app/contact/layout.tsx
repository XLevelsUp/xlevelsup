import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact XLevelsUp | Digital Marketing Agency',
    description: 'Get in touch with XLevelsUp for your digital marketing strategy. Book a consultation with our SEO & performance marketing experts.',
    alternates: {
        canonical: '/contact',
    },
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
