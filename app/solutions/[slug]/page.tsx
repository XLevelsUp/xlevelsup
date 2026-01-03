import { notFound } from 'next/navigation';
import { getSolutionBySlug, solutions } from '@/config/solutions.config';
import SolutionLayout from '@/components/solutions/SolutionLayout';
import type { Metadata } from 'next';

interface SolutionPageProps {
    params: {
        slug: string;
    };
}

// Generate static params for all solutions
export async function generateStaticParams() {
    return solutions.map((solution) => ({
        slug: solution.slug,
    }));
}

// Generate metadata for each solution
export async function generateMetadata({ params }: SolutionPageProps): Promise<Metadata> {
    const solution = getSolutionBySlug(params.slug);

    if (!solution) {
        return {
            title: 'Solution Not Found | XLEVELSUP',
        };
    }

    return {
        title: `${solution.title} | XLEVELSUP`,
        description: solution.subtitle,
        keywords: [solution.title, 'XLEVELSUP', ...solution.techStack],
    };
}

export default function SolutionPage({ params }: SolutionPageProps) {
    const solution = getSolutionBySlug(params.slug);

    if (!solution) {
        notFound();
    }

    return <SolutionLayout solution={solution} />;
}
