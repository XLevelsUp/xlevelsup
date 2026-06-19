'use client';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export function Table({ headers, children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto w-full rounded-lg scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent ${className}`}>
      <table className='w-full border-collapse text-left'>
        <thead>
          <tr className='border-b border-gray-850 bg-gray-900/40 text-xs uppercase tracking-wider text-gray-400 select-none'>
            {headers.map((header, index) => (
              <th
                key={index}
                className='px-5 py-4 font-semibold text-gray-300'
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-850/50 bg-[#0c0c0e]/20">{children}</tbody>
      </table>
    </div>
  );
}

interface TableRowProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TableRow({ children, onClick, className = '' }: TableRowProps) {
  return (
    <tr
      onClick={onClick}
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
  return (
    <td className={`px-5 py-4 text-sm text-gray-400 ${className}`}>
      {children}
    </td>
  );
}
