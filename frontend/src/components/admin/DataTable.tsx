import { type ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  keyField?: keyof T;
  empty?: string;
}

export function DataTable<T extends { id?: string }>({ columns, rows, keyField = 'id' as keyof T, empty = 'Sin datos' }: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-surface-300 bg-white p-10 text-center text-sm text-surface-500 dark:border-surface-700 dark:bg-surface-900">
        {empty}
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-xl border border-surface-200 bg-white dark:border-surface-800 dark:bg-surface-900">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-surface-200 text-sm dark:divide-surface-800">
          <thead className="bg-surface-50 dark:bg-surface-800/50">
            <tr>
              {columns.map((c) => (
                <th key={c.key} className={`px-4 py-3 text-left font-semibold text-surface-600 dark:text-surface-300 ${c.className || ''}`}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-200 dark:divide-surface-800">
            {rows.map((row) => (
              <tr key={String(row[keyField])} className="hover:bg-surface-50 dark:hover:bg-surface-800/50">
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 text-surface-700 dark:text-surface-300 ${c.className || ''}`}>
                    {c.render ? c.render(row) : (row as any)[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
