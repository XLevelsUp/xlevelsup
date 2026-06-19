'use client';

import { useState } from 'react';
import Link from 'next/link';
import { m as motion, AnimatePresence } from 'framer-motion';

export default function QuickActionFAB() {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      href: '/erp/employees',
      label: 'Add Employee',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
        </svg>
      ),
      color: 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30',
    },
    {
      href: '/erp/expenses',
      label: 'Record Expense',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3m0 0v3m0-3h3m-3 0h-3m-3 10h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      color: 'bg-purple/10 hover:bg-purple/20 text-purple-400 border border-purple-500/30',
    },
    {
      href: '/erp/client-finances',
      label: 'Client Invoice/Income',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30',
    },
    {
      href: '/erp/attendance',
      label: 'Mark Attendance',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30',
    },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 select-none">
      {/* Action Items List */}
      <AnimatePresence>
        {isOpen && (
          <div className="flex flex-col gap-3 items-end mb-1">
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, y: 15, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.9 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="flex items-center gap-2 group cursor-pointer"
              >
                {/* Tooltip */}
                <span className="bg-gray-900/90 text-white text-xs font-semibold px-2 py-1.5 rounded-lg border border-gray-800 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                  {action.label}
                </span>
                
                {/* Button */}
                <Link
                  href={action.href}
                  onClick={() => setIsOpen(false)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95 ${action.color}`}
                  aria-label={action.label}
                >
                  {action.icon}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Main Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full bg-gradient-to-tr from-cyan to-purple text-white flex items-center justify-center shadow-xl hover:shadow-cyan/35 transition-all duration-200 hover:scale-105 active:scale-95"
        aria-label="Quick Actions"
      >
        <motion.div
          animate={{ rotate: isOpen ? 135 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </motion.div>
      </button>
    </div>
  );
}
