import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About XLEVELSUP | End-to-End Tech & Software Solutions',
    description: 'XLEVELSUP is a technology firm, not a marketing agency. We build full-stack digital products, AI automation systems, and integrated growth solutions for ambitious businesses.',
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
