'use client';

import { createContext, useContext } from 'react';

// Lets <Table compact> tighten every <TableCell> inside it without each call
// site having to pass the same padding override to every cell.
const CompactContext = createContext(false);

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
  /** Tighter cell padding (px-3 py-3 instead of px-5 py-4) for wide tables
   * that would otherwise scroll sideways inside a sidebar-width layout. */
  compact?: boolean;
}

export function Table({ headers, children, className = '', compact = false }: TableProps) {
  return (
    <div className={`overflow-x-auto w-full rounded-lg scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent ${className}`}>
      <table className='w-full border-collapse text-left'>
        <thead>
          <tr className='border-b border-gray-850 bg-gray-900/40 text-xs uppercase tracking-wider text-gray-400 select-none'>
            {headers.map((header, index) => (
              <th
                key={index}
                className={`${compact ? 'px-3 py-3' : 'px-5 py-4'} font-semibold text-gray-300`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <CompactContext.Provider value={compact}>
          <tbody className="divide-y divide-gray-850/50 bg-[#0c0c0e]/20">{children}</tbody>
        </CompactContext.Provider>
      </table>
    </div>
  );
}

interface TableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  onDoubleClick?: () => void;
  className?: string;
}

export function TableRow({ children, onClick, onDoubleClick, className = '' }: TableRowProps) {
  return (
    <tr
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      className={`hover:bg-gray-850/30 transition-all duration-200 ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </tr>
  );
}

interface TableCellProps {
  children: React.ReactNode;
  className?: string;
}

export function TableCell({ children, className = '' }: TableCellProps) {
  const compact = useContext(CompactContext);
  return (
    <td className={`${compact ? 'px-3 py-3' : 'px-5 py-4'} text-sm text-gray-400 ${className}`}>
      {children}
    </td>
  );
}
