import type { Metadata } from 'next';
import Hero from '@/components/sections/Hero';
import Services from '@/components/sections/Services';
import SocialProof from '@/components/sections/SocialProof';
import About from '@/components/sections/About';
import Testimonials from '@/components/sections/Testimonials';
import Contact from '@/components/sections/Contact';
import LeadMagnetPopup from '@/components/LeadMagnetPopup';

export const metadata: Metadata = {
  title: 'XLEVELSUP | Custom Software & End-to-End Tech Solutions',
  description: 'We engineer custom web applications, AI automation workflows, and integrated growth marketing systems. Your end-to-end technology partner for scalable business growth.',
  keywords: [
    'Custom Software Development',
    'Next.js Engineers India',
    'AI Automation',
    'Full-Stack Development',
    'Tech Partner India',
    'Web Application Engineering',
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
