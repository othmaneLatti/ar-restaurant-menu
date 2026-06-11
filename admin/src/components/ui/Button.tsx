import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "px-6 py-3 font-semibold rounded-12 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed",
          {
            "bg-primary text-white hover:brightness-110 hover:shadow-[0_0_15px_rgba(255,107,53,0.4)] active:shadow-button-active": variant === 'primary',
            "bg-transparent border border-primary text-primary hover:bg-primary/10 active:shadow-button-active": variant === 'ghost',
            "bg-error text-white hover:brightness-110 hover:shadow-[0_0_15px_rgba(255,77,109,0.4)]": variant === 'danger',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
