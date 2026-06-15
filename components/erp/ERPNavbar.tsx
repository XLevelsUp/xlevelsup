'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { m as motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import { logout } from '@/actions/erp/auth';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface ERPNavbarProps {
  userEmail: string;
  userRole: string;
}

export default function ERPNavbar({ userEmail, userRole }: ERPNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const navItems = [
    { href: '/erp/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/erp/employees', label: 'Employees', icon: '👥' },
    { href: '/erp/attendance', label: 'Attendance', icon: '📅' },
    { href: '/erp/time-tracking', label: 'Time Tracking', icon: '⏰' },
    {
      href: '/erp/attendance-change-requests',
      label: 'Attendance Requests',
      icon: '📝',
    },
    { href: '/erp/payroll', label: 'Payroll', icon: '💰' },
    { href: '/erp/expenses', label: 'Expenses', icon: '💳' },
    { href: '/erp/client-finances', label: 'Client Finances', icon: '💼' },
    { href: '/erp/leave-requests', label: 'Leave', icon: '🏖️' },
  ];

  const handleLogout = async () => {
    const result = await logout();
    if (result.success) {
      toast.success('Logged out successfully', {
        duration: 2000,
        position: 'top-center',
      });
      router.push(result.redirectTo || '/erp/login');
    }
  };

  return (
    <nav className='glass border-b border-gray-800 sticky top-0 z-50'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex items-center justify-between h-16'>
          {/* Logo */}
          <div className='flex items-center gap-3'>
            <Link
              href='/erp/dashboard'
              className='text-2xl font-bold gradient-text'
            >
              XLEVELSUP ERP
            </Link>
          </div>

          {/* Navigation */}
          <div className='hidden md:flex items-center gap-1'>
            {navItems.map((item) => {
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                    isActive
                      ? 'bg-cyan/10 text-cyan border border-cyan/30'
                      : 'text-gray-300 hover:bg-dark-700 hover:text-white'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span className='font-medium'>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User menu */}
          <div className='flex items-center gap-4'>
            <div className='text-right hidden sm:block'>
              <p className='text-sm font-medium text-white'>{userEmail}</p>
              <p className='text-xs text-gray-400 capitalize'>{userRole}</p>
            </div>
            <Button
              variant='secondary'
              onClick={handleLogout}
              className='!px-4 !py-2 !text-sm'
            >
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className='md:hidden flex gap-2 pb-3 overflow-x-auto'>
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 rounded-lg transition-all duration-200 flex items-center gap-2 whitespace-nowrap text-sm ${
                  isActive
                    ? 'bg-cyan/10 text-cyan border border-cyan/30'
                    : 'text-gray-300 bg-dark-700'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
