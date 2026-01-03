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
  title: "XLEVELSUP | Engineering X Times More Growth",
  description: "Tech-driven marketing company engineering measurable business growth. We build high-performance websites, scalable eCommerce apps, and execute data-driven ad campaigns designed for speed, scalability, and revenue generation.",
  keywords: ["growth engineering", "high-performance websites", "eCommerce engineering", "data-driven marketing", "performance optimization", "scalable web applications", "marketing automation"],
  authors: [{ name: "XLEVELSUP" }],
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
    title: "XLEVELSUP | Engineering X Times More Growth",
    description: "We engineer growth systems. High-performance websites, scalable eCommerce platforms, and data-driven campaigns designed for measurable results.",
    type: "website",
    locale: "en_US",
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
