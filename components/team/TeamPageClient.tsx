'use client';

import { useState, useMemo } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import type { TeamMember } from '@/lib/erp/team';

/* ─── colour palette per department ─────────────────────────── */
const DEPT_COLORS: Record<string, { accent: string; bg: string; ring: string }> = {
  Leadership:  { accent: '#00F0FF', bg: 'rgba(0,240,255,0.08)',   ring: 'rgba(0,240,255,0.35)' },
  Engineering: { accent: '#3B82F6', bg: 'rgba(59,130,246,0.08)',  ring: 'rgba(59,130,246,0.35)' },
  Marketing:   { accent: '#B026FF', bg: 'rgba(176,38,255,0.08)',  ring: 'rgba(176,38,255,0.35)' },
  Design:      { accent: '#EC4899', bg: 'rgba(236,72,153,0.08)',  ring: 'rgba(236,72,153,0.35)' },
  Sales:       { accent: '#10B981', bg: 'rgba(16,185,129,0.08)',  ring: 'rgba(16,185,129,0.35)' },
  Operations:  { accent: '#F97316', bg: 'rgba(249,115,22,0.08)',  ring: 'rgba(249,115,22,0.35)' },
  HR:          { accent: '#EAB308', bg: 'rgba(234,179,8,0.08)',   ring: 'rgba(234,179,8,0.35)' },
  Finance:     { accent: '#14B8A6', bg: 'rgba(20,184,166,0.08)',  ring: 'rgba(20,184,166,0.35)' },
  Content:     { accent: '#A78BFA', bg: 'rgba(167,139,250,0.08)', ring: 'rgba(167,139,250,0.35)' },
};

const DEFAULT_COLOR = { accent: '#00F0FF', bg: 'rgba(0,240,255,0.08)', ring: 'rgba(0,240,255,0.25)' };

function getDeptColor(dept: string) {
  return DEPT_COLORS[dept] ?? DEFAULT_COLOR;
}

/* ─── hierarchy tier labels ──────────────────────────────────── */
const TIER_LABELS: Record<number, { label: string; icon: string; badge: string }> = {
  1: { label: 'Executive',  icon: '👑', badge: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  2: { label: 'Director',   icon: '🎯', badge: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  3: { label: 'Leadership', icon: '⭐', badge: 'bg-blue-500/20  text-blue-300  border-blue-500/30'   },
  4: { label: 'Team',       icon: '🚀', badge: 'bg-green-500/20 text-green-300  border-green-500/30'  },
  5: { label: 'Associate',  icon: '✨', badge: 'bg-gray-500/20  text-gray-300   border-gray-500/30'   },
};

/* ─── generate initials avatar colour from name ─────────────── */
function nameToGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue},70%,55%)`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

/** Calculate years of experience from joining date */
function tenureLabel(joiningDate: string): string {
  const join = new Date(joiningDate);
  const now  = new Date();
  const months = (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
  if (months < 1)   return 'Just joined';
  if (months < 12)  return `${months}m tenure`;
  const yrs = Math.floor(months / 12);
  const rem = months % 12;
  return rem > 0 ? `${yrs}y ${rem}m` : `${yrs} yr${yrs > 1 ? 's' : ''}`;
}

/* ─── Animation variants ─────────────────────────────────────── */
const cardVariants = {
  hidden: { opacity: 0, y: 32, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45 } },
  exit:   { opacity: 0, y: -16, scale: 0.96, transition: { duration: 0.25 } },
};

const sectionVariants = {
  hidden:   { opacity: 0, y: 24 },
  visible:  { opacity: 1, y: 0,  transition: { duration: 0.55, staggerChildren: 0.08 } },
};

/* ─── Individual member card ─────────────────────────────────── */
function MemberCard({ member, index }: { member: TeamMember; index: number }) {
  const color   = getDeptColor(member.department);
  const tier    = TIER_LABELS[member.hierarchy_level] ?? TIER_LABELS[5];
  const initials = getInitials(member.name);
  const avatarBg = nameToGradient(member.name);
  const isExec  = member.hierarchy_level === 1;

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      custom={index}
      className='group relative rounded-2xl overflow-hidden cursor-default select-none'
      style={{
        background: 'rgba(20,20,32,0.7)',
        border: `1px solid ${color.ring}`,
        backdropFilter: 'blur(12px)',
      }}
      whileHover={{ y: isExec ? -8 : -5, transition: { duration: 0.25 } }}
    >
      {/* Glow bloom on hover */}
      <div
        className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-2xl'
        style={{ background: `radial-gradient(ellipse at 50% 0%, ${color.bg} 0%, transparent 70%)` }}
      />

      {/* Top gradient bar */}
      <div
        className='h-[3px] w-full'
        style={{ background: `linear-gradient(90deg, ${color.accent}, #B026FF)` }}
      />

      {/* Executive star-burst background pattern */}
      {isExec && (
        <div
          className='absolute inset-0 opacity-[0.03] pointer-events-none'
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, ${color.accent} 0, ${color.accent} 1px, transparent 0, transparent 50%)`,
            backgroundSize: '16px 16px',
          }}
        />
      )}

      <div className='relative z-10 p-5'>
        {/* Avatar + name row */}
        <div className='flex items-start gap-4 mb-4'>
          {/* Avatar circle */}
          <div className='relative flex-shrink-0'>
            <div
              className='w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold text-white shadow-lg'
              style={{ background: `linear-gradient(135deg, ${avatarBg}, ${color.accent}80)` }}
            >
              {initials}
            </div>
            {/* Pulsing online dot */}
            <span
              className='absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-[#0A0A0F] animate-pulse'
              style={{ background: color.accent }}
            />
          </div>

          <div className='min-w-0 flex-1'>
            <div className='flex items-start justify-between gap-1'>
              <h3 className='text-sm font-bold text-white leading-tight truncate'>
                {member.name}
              </h3>
              {isExec && (
                <span className='text-base flex-shrink-0 ml-1' title='Executive'>👑</span>
              )}
            </div>
            <p className='text-xs mt-0.5 font-semibold truncate' style={{ color: color.accent }}>
              {/* Show only the primary title (first part of compound role) */}
              {member.role.split(/[&\/|\-–—+]|\band\b/i)[0].trim()}
            </p>
            {/* Specialty pill — shown for compound roles like "CFO & UI UX Engineer" */}
            {member.specialty && (
              <span
                className='inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-medium truncate max-w-full'
                style={{ background: `${color.accent}18`, color: color.accent, border: `1px solid ${color.accent}30` }}
                title={member.specialty}
              >
                🎨 {member.specialty}
              </span>
            )}
            <div className='flex items-center gap-1.5 mt-1.5 flex-wrap'>
              {/* Tier badge */}
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${tier.badge}`}
              >
                {tier.icon} {tier.label}
              </span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div
          className='h-px mb-4 opacity-20'
          style={{ background: `linear-gradient(90deg, ${color.accent}, transparent)` }}
        />

        {/* Meta info row */}
        <div className='grid grid-cols-2 gap-2 text-[11px] text-gray-400'>
          <div className='flex items-center gap-1.5'>
            <span style={{ color: color.accent }}>🏢</span>
            <span className='truncate'>{member.department}</span>
          </div>
          <div className='flex items-center gap-1.5'>
            <span style={{ color: color.accent }}>⏱</span>
            <span>{tenureLabel(member.joining_date)}</span>
          </div>
          <div className='col-span-2 flex items-center gap-1.5'>
            <span style={{ color: color.accent }}>🆔</span>
            <span className='font-mono'>{member.employee_id}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Department section header ──────────────────────────────── */
function DeptHeader({ dept, count }: { dept: string; count: number }) {
  const color = getDeptColor(dept);
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, x: -20 }, visible: { opacity: 1, x: 0, transition: { duration: 0.4 } } }}
      className='flex items-center gap-4 mb-6'
    >
      <div
        className='flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold'
        style={{ background: color.bg, color: color.accent, border: `1px solid ${color.ring}` }}
      >
        {dept}
        <span
          className='ml-1 px-2 py-0.5 rounded-full text-xs'
          style={{ background: color.ring, color: color.accent }}
        >
          {count}
        </span>
      </div>
      <div className='flex-1 h-px opacity-20' style={{ background: `linear-gradient(90deg, ${color.accent}, transparent)` }} />
    </motion.div>
  );
}

/* ─── Hierarchy legend strip ─────────────────────────────────── */
function HierarchyLegend() {
  return (
    <div className='flex flex-wrap justify-center gap-3 mb-10'>
      {Object.entries(TIER_LABELS).map(([level, { label, icon, badge }]) => (
        <div key={level} className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${badge}`}>
          {icon} {label}
        </div>
      ))}
    </div>
  );
}

/* ─── View toggle: "Grouped" vs "Grid" ──────────────────────── */
type ViewMode = 'hierarchy' | 'grid';

/* ─── Main Client Component ──────────────────────────────────── */
interface TeamPageClientProps {
  members: TeamMember[];
  departments: string[];
}

export default function TeamPageClient({ members, departments }: TeamPageClientProps) {
  const [activeDept, setActiveDept] = useState<string>('All');
  const [viewMode, setViewMode]     = useState<ViewMode>('hierarchy');
  const [search, setSearch]         = useState('');

  /* Filter */
  const filtered = useMemo(() => {
    let list = members;
    if (activeDept !== 'All') list = list.filter((m) => m.department === activeDept);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.role.toLowerCase().includes(q) ||
          m.department.toLowerCase().includes(q) ||
          m.employee_id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [members, activeDept, search]);

  /* Group by department for hierarchy view */
  const groupedByDept = useMemo(() => {
    const map = new Map<string, TeamMember[]>();
    for (const m of filtered) {
      if (!map.has(m.department)) map.set(m.department, []);
      map.get(m.department)!.push(m);
    }
    return map;
  }, [filtered]);

  /* Exec tier members (always shown at top) */
  const executives = useMemo(() => filtered.filter((m) => m.hierarchy_level === 1), [filtered]);

  /* Stats */
  const stats = useMemo(() => {
    const totalActive = members.length;
    const deptCount   = new Set(members.map((m) => m.department)).size;
    const execCount   = members.filter((m) => m.hierarchy_level === 1).length;
    const avgTenure   = (() => {
      if (!members.length) return 0;
      const totalMonths = members.reduce((acc, m) => {
        const join = new Date(m.joining_date);
        const now  = new Date();
        return acc + (now.getFullYear() - join.getFullYear()) * 12 + (now.getMonth() - join.getMonth());
      }, 0);
      return Math.round(totalMonths / members.length);
    })();
    return { totalActive, deptCount, execCount, avgTenure };
  }, [members]);

  return (
    <main className='min-h-screen overflow-hidden'>
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section className='relative py-28 px-4 text-center overflow-hidden'>
        {/* Background orbs */}
        <div className='absolute inset-0 pointer-events-none'>
          <div className='absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-[0.07] blur-3xl animate-pulse' style={{ background: '#00F0FF' }} />
          <div className='absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-[0.07] blur-3xl animate-pulse' style={{ background: '#B026FF', animationDelay: '1.2s' }} />
          <div className='absolute inset-0 opacity-[0.03]' style={{ backgroundImage: 'linear-gradient(rgba(0,240,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,240,255,0.5) 1px, transparent 1px)', backgroundSize: '72px 72px' }} />
        </div>

        <div className='max-w-5xl mx-auto relative z-10'>
          <motion.span
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='inline-block px-4 py-1.5 rounded-full text-xs font-bold tracking-widest uppercase mb-6 glass'
            style={{ color: '#00F0FF', borderColor: 'rgba(0,240,255,0.3)' }}
          >
            The Humans Behind the Magic
          </motion.span>

          <motion.h1
            className='text-5xl md:text-7xl font-bold mb-6 leading-tight'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
          >
            Meet the{' '}
            <span className='gradient-text'>Team</span>
          </motion.h1>

          <motion.p
            className='text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.2 }}
          >
            A collective of engineers, marketers, designers, and strategists
            united by one obsession —{' '}
            <span className='gradient-text font-semibold'>growing your business X times more</span>.
          </motion.p>

          {/* Live stats */}
          <motion.div
            className='flex flex-wrap justify-center gap-10 mt-12'
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.35 }}
          >
            {[
              { label: 'Team Members', value: `${stats.totalActive}` },
              { label: 'Departments',  value: `${stats.deptCount}`   },
              { label: 'Executives',   value: `${stats.execCount}`   },
              { label: 'Avg Tenure',   value: stats.avgTenure < 12 ? `${stats.avgTenure}m` : `${Math.floor(stats.avgTenure / 12)}y` },
            ].map((s) => (
              <div key={s.label} className='text-center'>
                <div className='text-3xl font-bold gradient-text'>{s.value}</div>
                <div className='text-sm text-gray-500 mt-1'>{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Controls bar ──────────────────────────────────────── */}
      <section className='px-4 pb-8 max-w-7xl mx-auto'>
        <motion.div
          className='glass rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-start md:items-center'
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {/* Search */}
          <div className='relative flex-1 max-w-sm'>
            <svg className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}>
              <path strokeLinecap='round' strokeLinejoin='round' d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' />
            </svg>
            <input
              type='text'
              placeholder='Search by name, role, department…'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className='w-full pl-9 pr-4 py-2.5 bg-[#1a1a2e] border border-gray-700 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan transition-colors'
            />
          </div>

          {/* Dept filter */}
          <div className='flex flex-wrap gap-2'>
            {['All', ...departments].map((dept) => {
              const color = dept === 'All' ? { accent: '#00F0FF', ring: 'rgba(0,240,255,0.3)' } : getDeptColor(dept);
              const active = activeDept === dept;
              return (
                <button
                  key={dept}
                  onClick={() => setActiveDept(dept)}
                  className='px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200'
                  style={{
                    background:   active ? color.accent : 'rgba(255,255,255,0.04)',
                    color:        active ? '#000' : color.accent,
                    border:       `1px solid ${active ? color.accent : color.ring}`,
                    transform:    active ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  {dept}
                </button>
              );
            })}
          </div>

          {/* View mode toggle */}
          <div className='flex gap-1 ml-auto bg-[#1a1a2e] rounded-lg p-1 border border-gray-700'>
            {(['hierarchy', 'grid'] as ViewMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className='px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-200 capitalize'
                style={{
                  background: viewMode === mode ? 'linear-gradient(135deg, #00F0FF, #B026FF)' : 'transparent',
                  color:      viewMode === mode ? '#000' : '#9CA3AF',
                }}
              >
                {mode === 'hierarchy' ? '🏛 Hierarchy' : '⊞ Grid'}
              </button>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ── Empty state ───────────────────────────────────────── */}
      {filtered.length === 0 && (
        <motion.div
          className='text-center py-24 text-gray-500'
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <div className='text-5xl mb-4'>🔍</div>
          <p className='text-lg'>No team members match your search.</p>
        </motion.div>
      )}

      {/* ── HIERARCHY VIEW ────────────────────────────────────── */}
      <AnimatePresence mode='wait'>
        {viewMode === 'hierarchy' && filtered.length > 0 && (
          <motion.section
            key='hierarchy'
            className='px-4 pb-20 max-w-7xl mx-auto space-y-16'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* ── Executives strip (full-width special layout) ── */}
            {executives.length > 0 && (
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className='flex items-center gap-4 mb-8'
                >
                  <div className='flex items-center gap-2 px-5 py-2 rounded-full text-sm font-bold' style={{ background: 'rgba(234,179,8,0.12)', color: '#EAB308', border: '1px solid rgba(234,179,8,0.3)' }}>
                    👑 Executive Leadership
                    <span className='ml-1 px-2 py-0.5 rounded-full text-xs bg-yellow-500/20'>{executives.length}</span>
                  </div>
                  <div className='flex-1 h-px opacity-20' style={{ background: 'linear-gradient(90deg, #EAB308, transparent)' }} />
                </motion.div>

                {/* Executive cards — larger, centred */}
                <div className={`grid gap-6 ${executives.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : executives.length === 2 ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
                  <AnimatePresence>
                    {executives.map((m, i) => (
                      <ExecutiveCard key={m.id} member={m} index={i} />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* ── Department sections ───────────────────────── */}
            {Array.from(groupedByDept.entries())
              .filter(([dept]) => {
                // Skip executives-only departments if they're already shown above
                const deptMembers = groupedByDept.get(dept) ?? [];
                const nonExec = deptMembers.filter((m) => m.hierarchy_level > 1);
                return nonExec.length > 0;
              })
              .map(([dept, deptMembers]) => {
                const nonExec = deptMembers.filter((m) => m.hierarchy_level > 1);
                return (
                  <motion.div
                    key={dept}
                    variants={sectionVariants}
                    initial='hidden'
                    whileInView='visible'
                    viewport={{ once: true, margin: '-80px' }}
                  >
                    <DeptHeader dept={dept} count={nonExec.length} />
                    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'>
                      <AnimatePresence>
                        {nonExec.map((m, i) => (
                          <MemberCard key={m.id} member={m} index={i} />
                        ))}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
          </motion.section>
        )}

        {/* ── GRID VIEW ───────────────────────────────────────── */}
        {viewMode === 'grid' && filtered.length > 0 && (
          <motion.section
            key='grid'
            className='px-4 pb-20 max-w-7xl mx-auto'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <HierarchyLegend />
            <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5'>
              <AnimatePresence>
                {filtered.map((m, i) => (
                  <MemberCard key={m.id} member={m} index={i} />
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* ── Culture section ───────────────────────────────────── */}
      <section className='px-4 pb-20 max-w-7xl mx-auto'>
        <motion.div
          className='text-center mb-12'
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className='text-3xl md:text-4xl font-bold mb-3'>
            How We <span className='gradient-text'>Work</span>
          </h2>
          <p className='text-gray-400 max-w-2xl mx-auto text-sm'>
            Our culture is built on engineering principles — systems thinking, measurable outcomes, and relentless iteration.
          </p>
        </motion.div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-5'>
          {[
            { icon: '🧠', title: 'Engineering Mindset',   color: '#00F0FF', desc: 'Every marketing challenge is a systems problem. If we can\'t measure it, we engineer a way to measure it first.' },
            { icon: '🔁', title: 'Iterate & Improve',     color: '#B026FF', desc: 'Weekly retrospectives, A/B testing obsession, and a culture where "good enough" is never shipped — only measurably better.' },
            { icon: '🤝', title: 'Client Partnership',    color: '#10B981', desc: 'We embed ourselves in your business goals, not just your deliverables. Your growth metrics are our KPIs.' },
          ].map((v, i) => (
            <motion.div
              key={v.title}
              className='rounded-2xl p-7 relative overflow-hidden group'
              style={{ background: 'rgba(20,20,32,0.6)', border: `1px solid ${v.color}25`, backdropFilter: 'blur(12px)' }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.12 }}
              whileHover={{ y: -4 }}
            >
              <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500' style={{ background: `radial-gradient(circle at 50% 0%, ${v.color}12, transparent 70%)` }} />
              <div className='relative z-10'>
                <div className='text-4xl mb-4'>{v.icon}</div>
                <h3 className='text-lg font-bold text-white mb-2'>{v.title}</h3>
                <p className='text-gray-400 text-sm leading-relaxed'>{v.desc}</p>
              </div>
              <div className='absolute bottom-0 left-0 right-0 h-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300' style={{ background: `linear-gradient(90deg, transparent, ${v.color}, transparent)` }} />
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────── */}
      <section className='px-4 pb-28'>
        <motion.div
          className='max-w-4xl mx-auto rounded-3xl p-12 text-center relative overflow-hidden'
          style={{ background: 'rgba(20,20,32,0.7)', border: '1px solid rgba(0,240,255,0.15)', backdropFilter: 'blur(16px)' }}
          initial={{ opacity: 0, y: 36 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className='absolute inset-0 bg-gradient-to-br from-cyan/5 to-purple/10 pointer-events-none' />
          <div className='absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10 blur-3xl' style={{ background: '#00F0FF' }} />
          <div className='absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-10 blur-3xl' style={{ background: '#B026FF' }} />
          <div className='relative z-10'>
            <div className='text-5xl mb-5'>🌟</div>
            <h2 className='text-3xl md:text-4xl font-bold mb-4'>
              Want to Join the <span className='gradient-text'>Crew?</span>
            </h2>
            <p className='text-gray-400 max-w-xl mx-auto mb-8 leading-relaxed'>
              We&apos;re always looking for exceptional engineers, marketers, and designers who believe growth is a science.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link
                href='/careers'
                id='careers-cta-btn'
                className='inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-black transition-all duration-300 hover:scale-105'
                style={{ background: 'linear-gradient(135deg, #00F0FF, #B026FF)', boxShadow: '0 0 24px rgba(0,240,255,0.2)' }}
              >
                View Open Positions
                <svg className='w-4 h-4' fill='none' viewBox='0 0 24 24' stroke='currentColor' strokeWidth={2}><path strokeLinecap='round' strokeLinejoin='round' d='M9 5l7 7-7 7' /></svg>
              </Link>
              <Link
                href='/contact'
                id='contact-team-btn'
                className='inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-105'
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </motion.div>
      </section>
    </main>
  );
}

/* ─── Executive card (larger, premium treatment) ─────────────── */
function ExecutiveCard({ member, index }: { member: TeamMember; index: number }) {
  const color    = getDeptColor(member.department);
  const initials = getInitials(member.name);
  const avatarBg = nameToGradient(member.name);

  return (
    <motion.div
      layout
      variants={cardVariants}
      initial='hidden'
      animate='visible'
      exit='exit'
      custom={index}
      className='group relative rounded-2xl overflow-hidden cursor-default'
      style={{ background: 'rgba(20,20,32,0.85)', border: '1px solid rgba(234,179,8,0.3)', backdropFilter: 'blur(16px)' }}
      whileHover={{ y: -8, transition: { duration: 0.25 } }}
    >
      {/* Gold shimmer bar */}
      <div className='h-[3px] w-full' style={{ background: 'linear-gradient(90deg, #EAB308, #F97316, #EAB308)', backgroundSize: '200% 100%' }} />

      {/* Subtle star pattern */}
      <div className='absolute inset-0 opacity-[0.025] pointer-events-none' style={{ backgroundImage: 'radial-gradient(circle, #EAB30840 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Hover glow */}
      <div className='absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none' style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(234,179,8,0.1) 0%, transparent 70%)' }} />

      <div className='relative z-10 p-7'>
        {/* Avatar — larger for execs */}
        <div className='flex flex-col items-center text-center mb-6'>
          <div className='relative mb-4'>
            <div
              className='w-20 h-20 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-xl'
              style={{ background: `linear-gradient(135deg, ${avatarBg}, #EAB30880)` }}
            >
              {initials}
            </div>
            {/* Crown badge */}
            <div className='absolute -top-2.5 -right-2.5 w-7 h-7 rounded-full bg-yellow-500 flex items-center justify-center text-sm shadow-lg border-2 border-[#0A0A0F]'>
              👑
            </div>
            {/* Pulsing ring */}
            <div className='absolute inset-0 rounded-2xl animate-ping opacity-10' style={{ border: '2px solid #EAB308' }} />
          </div>

          <h3 className='text-lg font-bold text-white'>{member.name}</h3>
          {/* Primary exec title — first part of compound role */}
          <p className='text-sm font-semibold mt-1' style={{ color: '#EAB308' }}>
            {member.role.split(/[&\/|\-–—+]|\band\b/i)[0].trim()}
          </p>
          {/* Specialty from compound role e.g. "UI UX Engineer" */}
          {member.specialty && (
            <span
              className='inline-block mt-1.5 px-3 py-1 rounded-lg text-xs font-semibold'
              style={{ background: 'rgba(234,179,8,0.12)', color: '#EAB308', border: '1px solid rgba(234,179,8,0.25)' }}
            >
              🎨 {member.specialty}
            </span>
          )}
          <div className='flex items-center gap-2 mt-2 text-xs text-gray-400'>
            <span>{member.department}</span>
            <span>·</span>
            <span>{tenureLabel(member.joining_date)}</span>
          </div>
        </div>

        {/* Divider */}
        <div className='h-px mb-4 opacity-30' style={{ background: 'linear-gradient(90deg, transparent, #EAB308, transparent)' }} />

        {/* Meta */}
        <div className='text-[11px] text-gray-400 text-center'>
          <div className='rounded-lg p-2' style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)' }}>
            <div className='text-yellow-400 font-bold text-sm font-mono'>{member.employee_id}</div>
            <div>Employee ID</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
