import React from 'react';
import { cn } from '../../utils/cn';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("bg-surface border border-border rounded-16 shadow-card p-6", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
