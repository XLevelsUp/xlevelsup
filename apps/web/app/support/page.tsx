import type { Metadata } from 'next';
import { CornerBrackets, BlueprintGrid } from '@/components/solutions/FigureSection';
import ContactForm from '@/components/ContactForm';
import { HeroField, Reveal, PulseDot } from './SupportClient';

// Server component: static contact details ship as HTML, only animations are client-side.

const MONO = 'var(--xlu-font-mono)';

// Mirrors the schema.org blocks in layout.tsx — keep in sync.
const PHONE_DISPLAY = '+91 90470 55888';
const PHONE_HREF = 'tel:+919047055888';
const EMAIL = 'hello@xlevelsup.com';
// Digits only, no '+', per wa.me's format.
const WHATSAPP_HREF = 'https://wa.me/919047055888';
const MAPS_HREF =
    'https://www.google.com/maps/search/?api=1&query=XLEVELSUP+Ramachandra+Rd+R.S.+Puram+Coimbatore+641002';

export const metadata: Metadata = {
    title: 'Support — Get Help from XLEVELSUP',
    description:
        'Reach the XLEVELSUP team in Coimbatore. Phone, email and WhatsApp support for existing clients, with published response times and office hours.',
    alternates: { canonical: '/support' },
    openGraph: {
        title: 'Support — Get Help from XLEVELSUP',
        description:
            'Phone, email and WhatsApp support with published response times. Monday to Friday, 9:00 AM - 6:00 PM IST.',
        url: '/support',
    },
};

const MailIcon = (
    <path d='M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' />
);
const PhoneIcon = (
    <path d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z' />
);
const ChatIcon = (
    <path d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
);
const PinIcon = (
    <>
        <path d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z' />
        <path d='M15 11a3 3 0 11-6 0 3 3 0 016 0z' />
    </>
);
const ClockIcon = <path d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' />;
const GlobeIcon = (
    <path d='M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c2.21 0 4-4.03 4-9s-1.79-9-4-9m0 18c-2.21 0-4-4.03-4-9s1.79-9 4-9' />
);

function Icon({ children }: { children: React.ReactNode }) {
    return (
        <svg
            className='h-5 w-5 shrink-0'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
            strokeWidth='1.75'
            strokeLinecap='round'
            strokeLinejoin='round'
            aria-hidden
        >
            {children}
        </svg>
    );
}

/** The three ways to reach a human, ordered fastest first. */
const CHANNELS = [
    {
        label: 'Call us',
        icon: PhoneIcon,
        href: PHONE_HREF,
        value: PHONE_DISPLAY,
        note: 'Fastest route during office hours',
    },
    {
        label: 'WhatsApp',
        icon: ChatIcon,
        href: WHATSAPP_HREF,
        value: PHONE_DISPLAY,
        note: 'Send screenshots and files',
    },
    {
        label: 'Email',
        icon: MailIcon,
        href: `mailto:${EMAIL}`,
        value: EMAIL,
        note: 'Best for detailed issues',
    },
];

// Public commitments — keep aligned with what the team can actually sustain.
const SLA = [
    {
        level: 'Urgent',
        window: '4 business hours',
        detail: 'Site down, payments failing, or a live campaign broken.',
        accent: 'var(--xlu-brand-1)',
    },
    {
        level: 'Normal',
        window: '1 business day',
        detail: 'Bugs, change requests, and anything blocking your work.',
        accent: 'var(--xlu-brand-3)',
    },
    {
        level: 'Low',
        window: '2 business days',
        detail: 'Questions, advice, and future enhancements.',
        accent: 'var(--xlu-ink-faint)',
    },
];

const COMPANY = [
    {
        label: 'Office',
        icon: PinIcon,
        href: MAPS_HREF,
        value: (
            <>
                2nd floor, 178, A, Ramachandra Rd,
                <br />
                R.S. Puram, Coimbatore,
                <br />
                Tamil Nadu 641002, India
            </>
        ),
    },
    {
        label: 'Office hours',
        icon: ClockIcon,
        value: (
            <>
                Monday - Friday
                <br />
                9:00 AM - 6:00 PM IST
            </>
        ),
    },
    {
        label: 'Languages',
        icon: GlobeIcon,
        value: 'English, Tamil',
    },
];

export default function SupportPage() {
    return (
        <main className='xlu min-h-screen'>
            {/* ContactPage schema, linked to the Organization in layout.tsx. */}
            <script
                type='application/ld+json'
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'ContactPage',
                        name: 'XLEVELSUP Support',
                        url: 'https://www.xlevelsup.com/support',
                        mainEntity: {
                            '@type': 'Organization',
                            '@id': 'https://www.xlevelsup.com/#organization',
                            contactPoint: {
                                '@type': 'ContactPoint',
                                telephone: '+91-90470-55888',
                                email: EMAIL,
                                contactType: 'technical support',
                                areaServed: 'IN',
                                availableLanguage: ['English', 'Tamil'],
                                hoursAvailable: {
                                    '@type': 'OpeningHoursSpecification',
                                    dayOfWeek: [
                                        'Monday',
                                        'Tuesday',
                                        'Wednesday',
                                        'Thursday',
                                        'Friday',
                                    ],
                                    opens: '09:00',
                                    closes: '18:00',
                                },
                            },
                        },
                    }),
                }}
            />

            <div className='xlu-container'>
                {/* ============ HERO ============ */}
                <section className='relative isolate overflow-hidden py-[var(--xlu-space-2xl)] text-center'>
                    <BlueprintGrid />
                    <HeroField />
                    <div
                        aria-hidden
                        className='pointer-events-none absolute inset-0'
                        style={{
                            background:
                                'radial-gradient(ellipse 90% 75% at 50% 50%, transparent 40%, var(--xlu-surface-0) 100%)',
                        }}
                    />
                    <CornerBrackets />

                    <Reveal className='relative mx-auto max-w-3xl'>
                        <div
                            className='mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5'
                            style={{
                                borderColor: 'var(--xlu-hairline)',
                                background: 'var(--xlu-surface-1)',
                            }}
                        >
                            <PulseDot />
                            <span
                                className='text-[0.65rem] uppercase'
                                style={{
                                    fontFamily: MONO,
                                    letterSpacing: '0.16em',
                                    color: 'var(--xlu-ink-subtle)',
                                }}
                            >
                                Mon-Fri · 9:00 AM - 6:00 PM IST
                            </span>
                        </div>

                        <h1 className='text-[2.5rem] font-bold leading-tight tracking-[-0.02em] sm:text-5xl md:text-6xl'>
                            Need a hand? <span className='xlu-brand-text'>We&apos;re here.</span>
                        </h1>
                        <p
                            className='mx-auto mt-6 max-w-2xl text-xl leading-relaxed'
                            style={{ color: 'var(--xlu-ink-muted)' }}
                        >
                            Existing client with an issue? Reach us directly — no ticket
                            queue, no bots. You&apos;ll talk to the team that built your
                            system.
                        </p>
                    </Reveal>
                </section>

                {/* ============ DIRECT CONTACT — heaviest surface (§12) ============ */}
                <Reveal delay={0.08} className='mx-auto max-w-5xl'>
                    <div
                        className='relative overflow-hidden rounded-2xl border'
                        style={{
                            borderColor: 'var(--xlu-hairline)',
                            background:
                                'linear-gradient(180deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
                            boxShadow: '0 32px 90px -30px rgba(0,0,0,0.9)',
                        }}
                    >
                        <CornerBrackets all />

                        {/* Console chrome, matching the rest of the site */}
                        <div
                            className='flex items-center gap-3 border-b px-5 py-3'
                            style={{ borderColor: 'var(--xlu-hairline)' }}
                        >
                            <span className='flex gap-1.5' aria-hidden>
                                {['#FF5F57', '#FEBC2E', '#28C840'].map((c) => (
                                    <span
                                        key={c}
                                        className='h-2.5 w-2.5 rounded-full'
                                        style={{ background: c, opacity: 0.55 }}
                                    />
                                ))}
                            </span>
                            <span
                                className='text-[0.7rem] uppercase'
                                style={{
                                    fontFamily: MONO,
                                    letterSpacing: '0.16em',
                                    color: 'var(--xlu-ink-faint)',
                                }}
                            >
                                direct line
                            </span>
                        </div>

                        <div className='grid gap-px sm:grid-cols-3' style={{ background: 'var(--xlu-hairline)' }}>
                            {CHANNELS.map((c) => (
                                <a
                                    key={c.label}
                                    href={c.href}
                                    {...(c.href.startsWith('http')
                                        ? { target: '_blank', rel: 'noopener noreferrer' }
                                        : {})}
                                    className='group flex flex-col gap-2 p-6 transition-colors'
                                    style={{ background: 'var(--xlu-surface-1)' }}
                                >
                                    <span
                                        className='flex items-center gap-2 text-[0.7rem] uppercase'
                                        style={{
                                            fontFamily: MONO,
                                            letterSpacing: '0.14em',
                                            color: 'var(--xlu-ink-faint)',
                                        }}
                                    >
                                        <Icon>{c.icon}</Icon>
                                        {c.label}
                                    </span>
                                    <span className='text-lg font-semibold transition-colors group-hover:text-[var(--xlu-brand-1)]'>
                                        {c.value}
                                    </span>
                                    <span
                                        className='text-sm'
                                        style={{ color: 'var(--xlu-ink-subtle)' }}
                                    >
                                        {c.note}
                                    </span>
                                </a>
                            ))}
                        </div>
                    </div>
                </Reveal>

                {/* ============ RESPONSE TIMES ============ */}
                <Reveal delay={0.16} className='mx-auto mt-3 max-w-5xl'>
                    <div
                        className='rounded-2xl border p-6 sm:p-8'
                        style={{
                            borderColor: 'var(--xlu-hairline)',
                            background: 'var(--xlu-surface-1)',
                        }}
                    >
                        <h2 className='text-2xl font-bold'>When you&apos;ll hear back</h2>
                        <p
                            className='mt-2 max-w-2xl text-sm leading-relaxed'
                            style={{ color: 'var(--xlu-ink-subtle)' }}
                        >
                            Targets are measured in business hours, Monday to Friday. Tell
                            us which applies when you get in touch and we&apos;ll triage
                            accordingly.
                        </p>

                        <div className='mt-6 grid gap-3 md:grid-cols-3'>
                            {SLA.map((s) => (
                                <div
                                    key={s.level}
                                    className='rounded-xl border p-5'
                                    style={{
                                        borderColor: 'var(--xlu-hairline)',
                                        background: 'var(--xlu-surface-2)',
                                        borderLeft: `3px solid ${s.accent}`,
                                    }}
                                >
                                    <p
                                        className='text-[0.7rem] uppercase'
                                        style={{
                                            fontFamily: MONO,
                                            letterSpacing: '0.14em',
                                            color: s.accent,
                                        }}
                                    >
                                        {s.level}
                                    </p>
                                    <p className='mt-2 text-xl font-bold'>{s.window}</p>
                                    <p
                                        className='mt-2 text-sm leading-relaxed'
                                        style={{ color: 'var(--xlu-ink-subtle)' }}
                                    >
                                        {s.detail}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </Reveal>

                {/* ============ REQUEST FORM ============ */}
                <Reveal delay={0.24} className='mx-auto mt-3 max-w-5xl'>
                    <div
                        className='relative overflow-hidden rounded-2xl border'
                        style={{
                            borderColor: 'var(--xlu-hairline)',
                            background:
                                'linear-gradient(180deg, var(--xlu-surface-2) 0%, var(--xlu-surface-1) 100%)',
                            boxShadow: '0 32px 90px -30px rgba(0,0,0,0.9)',
                        }}
                    >
                        <CornerBrackets all />
                        <div className='p-6 sm:p-8'>
                            <h2 className='text-2xl font-bold'>Raise a request</h2>
                            <p
                                className='mt-2 max-w-2xl text-sm leading-relaxed'
                                style={{ color: 'var(--xlu-ink-subtle)' }}
                            >
                                Prefer to write it down? Send the details and we&apos;ll pick
                                it up. For anything urgent, call — it&apos;s faster.
                            </p>
                            <div className='mt-6'>
                                <ContactForm variant='support' />
                            </div>
                        </div>
                    </div>
                </Reveal>

                {/* ============ COMPANY DETAILS ============ */}
                <Reveal delay={0.32} className='mx-auto mt-3 max-w-5xl pb-[var(--xlu-space-2xl)]'>
                    <div
                        className='rounded-2xl border'
                        style={{
                            borderColor: 'var(--xlu-hairline)',
                            background: 'var(--xlu-surface-1)',
                        }}
                    >
                        <div
                            className='border-b px-6 py-4 sm:px-8'
                            style={{ borderColor: 'var(--xlu-hairline)' }}
                        >
                            <h2 className='text-2xl font-bold'>XLEVELSUP</h2>
                            <p
                                className='mt-1 text-sm'
                                style={{ color: 'var(--xlu-ink-subtle)' }}
                            >
                                XLEVELSUP Technologies Private Limited
                            </p>
                        </div>

                        <dl className='grid gap-px sm:grid-cols-3' style={{ background: 'var(--xlu-hairline)' }}>
                            {COMPANY.map((d) => {
                                const body = (
                                    <>
                                        <dt
                                            className='flex items-center gap-2 text-[0.7rem] uppercase'
                                            style={{
                                                fontFamily: MONO,
                                                letterSpacing: '0.14em',
                                                color: 'var(--xlu-ink-faint)',
                                            }}
                                        >
                                            <Icon>{d.icon}</Icon>
                                            {d.label}
                                        </dt>
                                        <dd
                                            className='mt-3 text-sm leading-relaxed'
                                            style={{ color: 'var(--xlu-ink-muted)' }}
                                        >
                                            {d.value}
                                        </dd>
                                    </>
                                );

                                return d.href ? (
                                    <a
                                        key={d.label}
                                        href={d.href}
                                        target='_blank'
                                        rel='noopener noreferrer'
                                        className='group p-6 transition-colors sm:p-8'
                                        style={{ background: 'var(--xlu-surface-1)' }}
                                    >
                                        {body}
                                        <span
                                            className='mt-3 inline-block text-xs transition-colors group-hover:text-[var(--xlu-brand-1)]'
                                            style={{ color: 'var(--xlu-ink-faint)' }}
                                        >
                                            Open in Maps →
                                        </span>
                                    </a>
                                ) : (
                                    <div
                                        key={d.label}
                                        className='p-6 sm:p-8'
                                        style={{ background: 'var(--xlu-surface-1)' }}
                                    >
                                        {body}
                                    </div>
                                );
                            })}
                        </dl>

                        {/* Keeps /support and /contact distinct. */}
                        <div
                            className='border-t px-6 py-5 text-sm sm:px-8'
                            style={{
                                borderColor: 'var(--xlu-hairline)',
                                color: 'var(--xlu-ink-subtle)',
                            }}
                        >
                            Not an existing client?{' '}
                            <a
                                href='/contact'
                                className='font-medium underline underline-offset-4'
                                style={{ color: 'var(--xlu-brand-1)' }}
                            >
                                Start a new enquiry
                            </a>{' '}
                            instead.
                        </div>
                    </div>
                </Reveal>
            </div>
        </main>
    );
}
