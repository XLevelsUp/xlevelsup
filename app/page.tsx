import Hero from '@/components/sections/Hero';
import Services from '@/components/sections/Services';
import SocialProof from '@/components/sections/SocialProof';
import About from '@/components/sections/About';
import Testimonials from '@/components/sections/Testimonials';
import Contact from '@/components/sections/Contact';
import LeadMagnetPopup from '@/components/LeadMagnetPopup';

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
