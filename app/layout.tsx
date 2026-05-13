import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { GoogleAnalytics } from "@next/third-parties/google";
import ToastProvider from "@/components/ToastProvider";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: 'https://xlevelsup.com',
  title: {
    default: "XLEVELSUP | Custom Software & Scalable Tech Infrastructure",
    template: "%s | XLEVELSUP - End-to-End Tech Solutions",
  },
  description: "XLEVELSUP is a technology firm building high-performance web applications, AI automation workflows, and integrated growth marketing systems to scale your business end-to-end.",
  keywords: [
    "Custom Software Development",
    "Digital Marketing Agency Coimbatore",
    "SEO Services India",
    "Google Ads Management",
    "Meta Ads Agency",
    "Performance Marketing",
    "Growth Marketing Services",
    "Search Engine Optimization",
    "Analytics & Tracking",
    "Digital Marketing Strategy",
    "SEM Agency India",
    "PPC Management",
    "Coimbatore Tech Company",
    "Tamil Nadu Software Development",
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
        url: '/xlu_fav_icon.png',
        type: 'image/png',
      },
    ],
    apple: '/xlu_fav_icon.png',
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    siteName: "XLEVELSUP",
    title: "XLEVELSUP | Custom Software & Scalable Tech Infrastructure",
    description: "XLEVELSUP is a technology firm building high-performance web applications, AI automation workflows, and integrated growth marketing systems to scale your business end-to-end.",
    images: [
      {
        url: "/xlu_fav_icon.png",
        width: 1200,
        height: 630,
        alt: "XLEVELSUP - End-to-End Tech Solutions",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "XLevelsUp — Digital Marketing & SEO Agency | Coimbatore",
    description: "XLevelsUp is a performance-driven digital marketing agency specializing in SEO, Google Ads, Meta Ads & analytics to help brands grow measurably.",
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
        <ToastProvider />
        <Navbar />
        <div className="pt-20">
          {children}
        </div>
        <Footer />
        <GoogleAnalytics gaId="G-YPEGJ3VNCT" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "@id": "https://www.xlevelsup.com/#organization",
              "name": "XLevelsUp",
              "alternateName": ["XLU", "XLEVELSUP"],
              "legalName": "XLEVELSUP Technologies Private Limited",
              "url": "https://www.xlevelsup.com",
              "logo": "https://www.xlevelsup.com/logo.png",
              "sameAs": [
                "https://www.linkedin.com/company/xlevelsup",
                "https://twitter.com/xlevelsup",
                "https://www.instagram.com/xlevelsup",
                "https://www.facebook.com/xlevelsup"
              ],
              "contactPoint": {
                "@type": "ContactPoint",
                "telephone": "+91-90470-55888",
                "contactType": "customer service",
                "areaServed": "IN",
                "availableLanguage": "English"
              }
            })
          }}
        />
      </body>
    </html>
  );
}
