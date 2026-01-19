import type { Metadata } from 'next';
import Hero from '@/components/sections/Hero';
import Services from '@/components/sections/Services';
import SocialProof from '@/components/sections/SocialProof';
import About from '@/components/sections/About';
import Testimonials from '@/components/sections/Testimonials';
import Contact from '@/components/sections/Contact';
import LeadMagnetPopup from '@/components/LeadMagnetPopup';

export const metadata: Metadata = {
  title: 'XLEVELSUP | Engineering Business Growth',
  description: 'Stop guessing. Start engineering. We build high-performance Next.js websites, scalable eCommerce apps, and algorithmic ad campaigns to scale business revenue.',
  keywords: [
    'Marketing Engineering',
    'Growth Hacking Agency',
    'Next.js Developers India',
    'Performance Marketing',
    'AI Automation',
    'XLU',
  ],
};

export default function Home() {
  return (
    <main className="min-h-screen">
      <Hero />
      <Services />
      <SocialProof />
      <About />
      <Testimonials />
      <Contact />
      <LeadMagnetPopup />
    </main>
  );
}
