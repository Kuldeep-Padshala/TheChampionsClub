import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
          {
            'bg-gold-primary text-white hover:bg-gold-dark shadow-md hover:shadow-lg': variant === 'primary',
            'bg-navy-primary text-white hover:bg-navy-mid shadow-md hover:shadow-lg': variant === 'secondary',
            'border border-gold-primary text-gold-primary hover:bg-gold-primary hover:text-white': variant === 'outline',
            'hover:bg-bg-subtle text-navy-primary': variant === 'ghost',
            'h-10 px-5 text-sm tracking-wide': size === 'sm',
            'h-12 px-8 text-base tracking-wide': size === 'md',
            'h-14 px-10 text-lg tracking-wide': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

