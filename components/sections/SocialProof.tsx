'use client';

import { m as motion } from 'framer-motion';

export default function SocialProof() {
  const clients = [
    { name: 'Pratyagra Silks' },
    { name: 'Wanderingkite' },
    { name: 'Nihaa Jewels' },
    { name: 'Alusea' },
    { name: 'Kandangi Sarees' },
    { name: 'TagMyTaxi' },
    { name: 'Astrosara' },
    { name: 'Studio OS' },
  ];

  // Duplicate for seamless loop
  const duplicatedClients = [...clients, ...clients];

  return (
    <section className='py-16 px-4 bg-dark-800/50'>
      <style>{`
        @keyframes scroll-desktop {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        @keyframes scroll-mobile {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-200%); }
        }
        .animate-scroll-desktop {
          animation: scroll-desktop 20s linear infinite;
        }
        .animate-scroll-mobile {
          animation: scroll-mobile 20s linear infinite;
        }
      `}</style>
      <div className='max-w-7xl mx-auto'>
        <motion.h2
          className='text-center text-gray-400 text-sm uppercase tracking-wider mb-8'
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          Trusted by Industry Leaders
        </motion.h2>

        <div className='relative overflow-hidden hidden sm:block'>
          <div className='flex gap-16 animate-scroll-desktop marquee-content w-max'>
            {duplicatedClients.map((client, index) => (
              <div
                key={index}
                className='shrink-0 text-2xl font-bold text-gray-500 whitespace-nowrap block'
              >
                {client.name}
              </div>
            ))}
          </div>
        </div>

        <div className='relative overflow-hidden sm:hidden block'>
          <div className='flex gap-16 animate-scroll-mobile marquee-content w-max'>
            {duplicatedClients.map((client, index) => (
              <div
                key={index}
                className='shrink-0 text-2xl font-bold text-gray-500 whitespace-nowrap block'
              >
                {client.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
