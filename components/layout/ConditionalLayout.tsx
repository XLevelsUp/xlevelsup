'use client';

import { usePathname } from 'next/navigation';
import Navbar from './Navbar';
import Footer from './Footer';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isERPRoute = pathname?.startsWith('/erp');

  return (
    <>
      {!isERPRoute && <Navbar />}
      <div className={isERPRoute ? '' : 'pt-20'}>{children}</div>
      {!isERPRoute && <Footer />}
    </>
  );
}
