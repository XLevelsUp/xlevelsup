import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI & Marketing Automation | XLevelsUp',
    description: 'AI-powered marketing automation to scale operations, automate lead qualification, and enhance customer engagement.',
    keywords: [
        'AI Automation',
        'Marketing Automation',
        'AI-Powered Tools',
        'Lead Qualification Automation',
        'Customer Support Automation',
        'Business Process Automation',
        'LangChain Development',
        'OpenAI Integration',
    ],
};

export default function AIAutomationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
