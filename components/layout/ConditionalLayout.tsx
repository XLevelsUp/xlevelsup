'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';
import WhatsAppButton from '@/components/ui/WhatsAppButton';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isERPRoute = pathname?.startsWith('/erp');
  const isEmployeeRoute = pathname?.startsWith('/employee');
  const isPublicRoute = !isERPRoute && !isEmployeeRoute;

  return (
    <>
      {!isERPRoute && <Navbar />}
      <div className={isERPRoute ? '' : 'pt-20'}>{children}</div>
      {!isERPRoute && <Footer />}
      {isPublicRoute && <WhatsAppButton />}
    </>
  );
}
