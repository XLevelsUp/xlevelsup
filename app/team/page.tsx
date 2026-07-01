import type { Metadata } from 'next';
import { getTeamMembers, getUniqueDepartments } from '@/lib/erp/team';
import TeamPageClient from '@/components/team/TeamPageClient';

export const metadata: Metadata = {
  title: 'Meet the Team | XLEVELSUP — The People Behind the Growth',
  description:
    'Meet the engineers, marketers, designers, and strategists at XLEVELSUP who build growth systems that scale your business X times more. Based in Coimbatore, India.',
  keywords: [
    'XLEVELSUP Team',
    'XLU Team Members',
    'Digital Agency Team Coimbatore',
    'Marketing Engineers India',
    'Growth Strategy Team',
  ],
  openGraph: {
    title: 'Meet the Team | XLEVELSUP',
    description:
      'Engineers, marketers, designers and strategists united by one obsession — growing your business X times more.',
    url: '/team',
    type: 'website',
  },
};

// Revalidate every 5 minutes so new employees appear quickly
export const revalidate = 300;

export default async function TeamPage() {
  const members = await getTeamMembers();
  const departments = getUniqueDepartments(members);

  return <TeamPageClient members={members} departments={departments} />;
}
