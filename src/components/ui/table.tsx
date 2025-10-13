import { clsx } from 'clsx';

interface Column<T> {
  key: keyof T;
  header: string;
  render?: (value: T[keyof T], row: T) => React.ReactNode;
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
  onRowClick?: (row: T) => void;
}

export function Table<T extends Record<string, unknown>>({ 
  columns, 
  data, 
  className,
  onRowClick 
}: TableProps<T>) {
  return (
    <div className={clsx('overflow-hidden rounded-xl border border-neutral-700', className)}>
      <table className="min-w-full divide-y divide-neutral-700">
        <thead className="bg-neutral-800">
          <tr>
            {columns.map((column) => (
              <th
                key={String(column.key)}
                className="px-6 py-3 text-left text-xs font-medium text-neutral-300 uppercase tracking-wider"
                style={{ width: column.width }}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-neutral-800 divide-y divide-neutral-700">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={clsx(
                'hover:bg-neutral-700 transition-colors duration-150',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <td key={String(column.key)} className="px-6 py-4 whitespace-nowrap text-sm text-white">
                  {column.render ? column.render(row[column.key], row) : String(row[column.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
