'use client';

import { motion } from 'framer-motion';

export default function SocialProof() {
  const clients = [
    { name: 'Pratyagra Silks', url: 'https://pratyagrasilks.com' },
    { name: 'Wanderingkite', url: 'https://www.wanderingkite.in' },
    { name: 'Nihaa Jewels', url: 'https://www.nihaajewels.com' },
    { name: 'Alusea', url: 'https://www.alusea.in' },
    { name: 'Kandangi Sarees', url: 'https://www.kandangisarees.com' },
    { name: 'TagMyTaxi', url: 'https://tagmytaxi.ae' },
    { name: 'Astrosara', url: 'https://astrosara.in' },
  ];

  // Duplicate for seamless loop
  const duplicatedClients = [...clients, ...clients];

  return (
    <section className='py-16 px-4 bg-dark-800/50'>
      <style>{`
        .pause-hover:hover .marquee-content {
          animation-play-state: paused !important;
        }
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

        <div className='relative overflow-hidden hidden sm:block pause-hover'>
          <div className='flex gap-16 animate-scroll-desktop marquee-content w-max'>
            {duplicatedClients.map((client, index) => (
              <a
                key={index}
                href={client.url}
                target='_blank'
                rel='noopener noreferrer'
                className='shrink-0 text-2xl font-bold text-gray-500 hover:text-white hover:scale-110 hover:-translate-y-1 transition-all duration-300 whitespace-nowrap block'
              >
                {client.name}
              </a>
            ))}
          </div>
        </div>

        <div className='relative overflow-hidden sm:hidden block pause-hover'>
          <div className='flex gap-16 animate-scroll-mobile marquee-content w-max'>
            {duplicatedClients.map((client, index) => (
              <a
                key={index}
                href={client.url}
                target='_blank'
                rel='noopener noreferrer'
                className='shrink-0 text-2xl font-bold text-gray-500 hover:text-white hover:scale-110 hover:-translate-y-1 transition-all duration-300 whitespace-nowrap block'
              >
                {client.name}
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
