import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ERP System | XLEVELSUP',
  description:
    'Internal ERP system for employee management, attendance, payroll, and expenses',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ERPLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
