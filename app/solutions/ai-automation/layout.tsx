import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'AI Automation & Workflow Engineering | XLEVELSUP',
    description: 'Scale operations, not costs. We engineer custom AI agents and Python workflows to automate lead qualification, CRM entry, and customer support.',
    keywords: [
        'AI Automation',
        'Python Automation',
        'Workflow Automation',
        'AI Agents',
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
