import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: 'https://xlevelsup.com',
  title: {
    default: "XLEVELSUP | Engineering Business Growth",
    template: "%s | XLEVELSUP - Marketing Engineering",
  },
  description: "Tech-driven marketing agency. We build high-performance Next.js websites, scalable eCommerce apps, and algorithmic ad campaigns. Engineering X times more growth.",
  keywords: [
    "Marketing Engineering",
    "Next.js Agency",
    "Programmatic SEO",
    "Growth Hacking India",
    "High-Performance Websites",
    "eCommerce Engineering",
    "Data-Driven Marketing",
    "Performance Optimization",
    "Scalable Web Applications",
    "Marketing Automation",
    "Coimbatore Marketing Agency",
    "Tamil Nadu Web Development",
    "XLU",
  ],
  authors: [{ name: "XLEVELSUP" }],
  creator: "XLEVELSUP",
  publisher: "XLEVELSUP",
  icons: {
    icon: [
      {
        url: '/favicon.ico',
        sizes: '32x32',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/xlu_fav_icon.png',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "XLEVELSUP",
    title: "XLEVELSUP | Engineering Business Growth",
    description: "Tech-driven marketing agency. We build high-performance Next.js websites, scalable eCommerce apps, and algorithmic ad campaigns.",
    images: [
      {
        url: "/xlu_fav_icon.png",
        width: 1200,
        height: 630,
        alt: "XLEVELSUP - Marketing Engineering",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XLEVELSUP | Engineering Business Growth",
    description: "Tech-driven marketing agency. We build high-performance Next.js websites, scalable eCommerce apps, and algorithmic ad campaigns.",
    images: ["/xlu_fav_icon.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <Navbar />
        <div className="pt-20">
          {children}
        </div>
        <Footer />
      </body>
    </html>
  );
}
