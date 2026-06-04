import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About XLEVELSUP | End-to-End Design, Web, Marketing & AI Agency India',
    description: 'XLEVELSUP is an end-to-end growth partner based in Coimbatore, India — delivering logo design, website development, eCommerce, Meta & Google Ads, social media management, ERP software, and AI automation for businesses that want to scale.',
};

export default function AboutLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
