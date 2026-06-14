'use client';

import { useEffect } from 'react';
import { m as motion, AnimatePresence } from 'framer-motion';
import { ModalProps } from '@/types';

export default function Modal({
  isOpen,
  onClose,
  children,
  title,
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className='fixed inset-0 bg-black/70 backdrop-blur-md z-50'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <div className='fixed inset-0 z-50 flex items-center justify-center p-4'>
            <motion.div
              className='glass max-w-2xl w-full p-8 rounded-2xl relative max-h-[90vh] overflow-y-auto'
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className='absolute top-4 right-4 text-gray-400 hover:text-white transition-colors'
                aria-label='Close modal'
              >
                <svg
                  className='w-6 h-6'
                  fill='none'
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth='2'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path d='M6 18L18 6M6 6l12 12'></path>
                </svg>
              </button>

              {title && (
                <h2 className='text-2xl font-bold mb-6 gradient-text'>
                  {title}
                </h2>
              )}

              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
