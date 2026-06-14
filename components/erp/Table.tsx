'use client';

interface TableProps {
  headers: string[];
  children: React.ReactNode;
  className?: string;
}

export function Table({ headers, children, className = '' }: TableProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className='w-full border-collapse'>
        <thead>
          <tr className='border-b border-gray-700'>
            {headers.map((header, index) => (
              <th
                key={index}
                className='text-left px-4 py-3 text-sm font-semibold text-gray-300 uppercase tracking-wider'
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
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
      className={`border-b border-gray-800 hover:bg-dark-700 transition-colors ${
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
    <td className={`px-4 py-3 text-sm text-gray-300 ${className}`}>
      {children}
    </td>
  );
}
