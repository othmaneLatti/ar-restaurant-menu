import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && <label className="text-sm font-medium text-text-primary">{label}</label>}
        <input
          ref={ref}
          className={cn(
            "bg-surface border focus:outline-none focus:ring-1 rounded-10 px-4 py-3 text-text-primary w-full transition-all duration-150 placeholder-text-muted",
            error ? "border-error focus:border-error focus:ring-error" : "border-border focus:border-primary focus:ring-primary",
            className
          )}
          {...props}
        />
        {error && <span className="text-xs text-error mt-1">{error}</span>}
      </div>
    );
  }
);
Input.displayName = 'Input';
