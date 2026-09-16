/**
 * Root layout for admin.xlevelsup.com — the ERP and the employee portal.
 *
 * Deliberately minimal next to the marketing site's root layout: no GTM, no
 * JSON-LD, no Navbar/Footer/Preloader. This app is internal and noindex, so
 * every byte of SEO and analytics machinery that lived in the shared layout is
 * dead weight here.
 *
 * AnimationProvider is NOT optional: ERP components import `m` from
 * framer-motion, which throws under `LazyMotion strict` unless that provider is
 * an ancestor.
 */
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AnimationProvider from '@/components/AnimationProvider';
import ToastProvider from '@/components/ToastProvider';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_ADMIN_URL || 'https://admin.xlevelsup.com',
  ),
  title: {
    default: 'XLEVELSUP Admin',
    template: '%s | XLEVELSUP Admin',
  },
  description:
    'Internal ERP and employee portal for XLEVELSUP — employee management, attendance, payroll, billing and expenses.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/xlu_fav_icon.png', type: 'image/png' },
    ],
    apple: '/xlu_fav_icon.png',
  },
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en-IN'>
      <body className={`${inter.className} antialiased`}>
        <AnimationProvider>
          <ToastProvider />
          {children}
        </AnimationProvider>
      </body>
    </html>
  );
}
