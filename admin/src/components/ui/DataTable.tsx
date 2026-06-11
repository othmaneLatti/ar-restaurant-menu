import React from 'react';
import { cn } from '../../utils/cn';

interface DataTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headers: string[];
  children: React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({ headers, children, className, ...props }) => {
  return (
    <div className="w-full overflow-x-auto rounded-12 border border-border bg-surface">
      <table className={cn("w-full text-left text-sm", className)} {...props}>
        <thead className="bg-secondary/50 text-text-muted border-b border-border">
          <tr>
            {headers.map((header, idx) => (
              <th key={idx} className="px-6 py-4 font-medium">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {children}
        </tbody>
      </table>
    </div>
  );
};
