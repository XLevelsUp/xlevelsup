import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | XLEVELSUP',
    description: 'How XLEVELSUP collects, uses, and protects your data across our software and digital infrastructure.',
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
