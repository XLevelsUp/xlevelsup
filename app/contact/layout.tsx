import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Get Your Growth Audit | Contact XLEVELSUP',
    description: 'Book a 15-minute strategy call. Let\'s analyze your stack and engineer a roadmap for revenue growth.',
};

export default function ContactLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
