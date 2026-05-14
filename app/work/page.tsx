'use client';

import { m as motion } from 'framer-motion';
import Link from 'next/link';



export default function WorkPage() {
  const projects = [
    {
      id: 1,
      name: 'Pratyagra Silks',
      tag: 'eCommerce / Scale',
      description:
        'Engineered a high-performance eCommerce platform that increased online revenue by 300% in 6 months.',
      metrics: [
        '300% Revenue Growth',
        '70% Faster Load Times',
        '2.5x Conversion Rate',
      ],
      gradient: 'from-cyan/20 to-purple/20',
      link: 'https://pratyagrasilks.com',
    },
    {
      id: 2,
      name: 'Wanderingkite Studio',
      tag: 'Brand Design / UX',
      description:
        'Optimized tech stack and built a high-performance platform with focus on user experience and brand identity.',
      metrics: [
        '70% Load Time Reduction',
        '2.5x Conversions',
        'Modern Tech Stack',
      ],
      gradient: 'from-purple/20 to-pink/20',
      link: 'https://www.wanderingkite.in',
    },
    {
      id: 3,
      name: 'Nihaa Jewels',
      tag: 'Digital Presence',
      description:
        'Crafted an elegant digital storefront for a fine jewellery brand, translating their in-store luxury experience into a seamless online discovery journey.',
      metrics: ['4x Organic Traffic Growth', '60% Longer Session Duration', '3x More Enquiries via Web'],
      gradient: 'from-blue/20 to-cyan/20',
      link: 'https://www.nihaajewels.com',
    },
    {
      id: 4,
      name: 'Alusea',
      tag: 'Digital Presence',
      description:
        'Built a modern digital presence from the ground up with focus on performance and user engagement.',
      metrics: [
        'Modern Architecture',
        'High Performance',
        'Enhanced Engagement',
      ],
      gradient: 'from-green/20 to-cyan/20',
      link: 'https://www.alusea.in',
    },
    {
      id: 5,
      name: 'TagMyTaxi',
      tag: 'Brand Design / UX',
      description: 'Designed a modern, conversion-focused website that gave a UAE-based taxi service a credible brand identity and a booking experience riders actually trust.',
      metrics: ['85% Improvement in Brand Perception', '40% Drop in Bounce Rate', '2x More Booking Inquiries'],
      gradient: 'from-cyan/20 to-green/20',
      link: 'https://tagmytaxi.ae',
    },
    {
      id: 6,
      name: 'Kandangi Sarees',
      tag: 'eCommerce / Scale',
      description: 'Built a rich, catalogue-driven eCommerce experience for a traditional handloom brand — making it effortless for customers to explore, fall in love, and buy.',
      metrics: ['5x Product Discoverability', '65% Increase in Add-to-Cart Rate', '3.2x Revenue in First Quarter'],
      gradient: 'from-pink/20 to-purple/20',
      link: 'https://www.kandangisarees.com',
    },
    {
      id: 7,
      name: 'Studio OS',
      tag: 'ERP / SaaS',
      description: 'Delivered a clean, intuitive ERP/SaaS web platform that simplified complex studio operations — reducing admin overhead and giving teams more time to focus on what matters.',
      metrics: ['70% Reduction in Manual Tasks', '50% Faster Onboarding', '98% User Retention at 3 Months'],
      gradient: 'from-purple/20 to-blue/20',
      link: 'https://www.wanderingkite.in/studiospace',
    },
    {
      id: 8,
      name: 'Astrosara',
      tag: 'Digital Presence',
      description: 'Created a compelling digital home for an astrology platform — building trust through intentional design and driving consistent user engagement from day one.',
      metrics: ['3.5x Growth in Daily Active Users', '55% More Consultation Bookings', '80% Positive User Feedback Score'],
      gradient: 'from-cyan/20 to-blue/20',
      link: 'https://astrosara.in',
    },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <main className='min-h-screen py-24 px-4'>
      <div className='max-w-7xl mx-auto'>
        {/* Header */}
        <motion.div
          className='text-center mb-16'
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className='text-5xl md:text-6xl font-bold mb-6'>
            Engineered <span className='gradient-text'>Results</span>
          </h1>
          <p className='text-xl text-gray-400 max-w-3xl mx-auto'>
            Real projects. Measurable outcomes. Engineering-driven growth for
            businesses across industries.
          </p>
        </motion.div>

        {/* Projects Grid */}
        <motion.div
          className='grid grid-cols-1 md:grid-cols-2 gap-8'
          variants={containerVariants}
          initial='hidden'
          animate='visible'
        >
          {projects.map((project) => (
            <motion.div
              key={project.id}
              variants={cardVariants}
              className='group relative glass p-8 rounded-2xl overflow-hidden hover:border-cyan transition-all duration-300'
              whileHover={{ y: -10 }}
            >
              {/* Gradient Background */}
              <div
                className={`absolute inset-0 bg-linear-to-br ${project.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              ></div>

              {/* Content */}
              <div className='relative z-10'>
                {/* Tag */}
                <div className='inline-block px-4 py-1 rounded-full glass mb-4'>
                  <span className='text-sm gradient-text font-semibold'>
                    {project.tag}
                  </span>
                </div>

                {/* Project Name */}
                <h3 className='text-2xl font-bold mb-4'>{project.name}</h3>

                {/* Description */}
                <p className='text-gray-300 leading-relaxed mb-6'>
                  {project.description}
                </p>

                {/* Metrics */}
                <div className='space-y-2 mb-6'>
                  {project.metrics.map((metric, index) => (
                    <div key={index} className='flex items-center gap-2'>
                      <div className='w-1.5 h-1.5 rounded-full bg-linear-to-r from-cyan to-purple'></div>
                      <span className='text-sm text-gray-400'>{metric}</span>
                    </div>
                  ))}
                </div>

                {/* View Project Button */}
                <div className='opacity-0 group-hover:opacity-100 transition-opacity duration-300'>
                  <Link
                    href={project?.link || `/work/${project.id}`}
                    target={project?.link ? '_blank' : '_self'}
                    className='inline-flex items-center gap-2 text-cyan hover:text-purple transition-colors duration-200'
                  >
                    <span className='font-semibold'>View Project</span>
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth='2'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path d='M17 8l4 4m0 0l-4 4m4-4H3'></path>
                    </svg>
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className='mt-20 text-center'
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className='glass p-12 rounded-2xl max-w-3xl mx-auto'>
            <h2 className='text-3xl font-bold mb-4'>
              Ready to Engineer{' '}
              <span className='gradient-text'>Your Growth?</span>
            </h2>
            <p className='text-gray-400 mb-8'>
              Let&apos;s analyze your workflows and build a growth system tailored to
              your business.
            </p>
            <Link
              href='/#contact'
              className='inline-block px-8 py-4 rounded-lg bg-linear-to-r from-cyan to-purple text-white font-semibold hover:shadow-lg hover:shadow-purple/50 transition-all duration-300'
            >
              Get Your Growth Audit
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
