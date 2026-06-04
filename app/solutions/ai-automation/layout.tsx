import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Custom AI Automation Systems & Operational Intelligence Workflows | XLEVELSUP',
    description: 'Replace high-overhead manual tasks with deterministic AI multi-agent systems and custom Python workflows. Scalable operational intelligence engineered for ROI.',
    keywords: [
        'Custom AI Agent Workflows',
        'Operational Intelligence Software',
        'n8n Enterprise Automation',
        'Python Backend Workflow Integration',
        'Multi-Agent AI Systems',
        'AI Automation India',
        'XLEVELSUP',
        'XLU',
    ],
};

export default function AIAutomationLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <>{children}</>;
}
