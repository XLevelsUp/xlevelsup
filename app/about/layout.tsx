import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About XLEVELSUP | Merging Code & Creativity',
    description: 'XLEVELSUP bridges the gap between software engineering and creative marketing. Meet the team building the future of growth.',
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
