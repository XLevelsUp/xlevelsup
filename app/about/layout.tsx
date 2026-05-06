import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About XLEVELSUP | End-to-End Tech & Software Solutions',
    description: 'Learn about XLevelsUp, a performance-driven digital marketing agency specializing in SEO, Google Ads, Meta Ads & analytics to help brands grow measurably.',
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
