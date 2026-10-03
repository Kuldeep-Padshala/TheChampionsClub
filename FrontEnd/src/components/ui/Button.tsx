import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Button — Haute Horlogerie & Private Club Luxury Button
 * Built with subtle tactile spring physics, specular highlight, and champagne gold accents.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#B89047]/50 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.97] select-none font-display',
          {
            'bg-[#121214] text-white hover:bg-black border border-[#B89047]/45 shadow-[0_4px_16px_rgba(18,18,20,0.25)] hover:shadow-[0_8px_24px_rgba(184,144,71,0.35)] dark:bg-gradient-to-r dark:from-[#EAD29A] dark:via-[#B89047] dark:to-[#B89047] dark:text-[#0A0A0D] dark:border-[#EAD29A]/60 dark:shadow-[0_4px_20px_rgba(184,144,71,0.35)]':
              variant === 'primary',
            'bg-gradient-to-r from-[#B89047] via-[#EAD29A] to-[#B89047] text-[#0A0A0D] font-bold shadow-md hover:brightness-105 border border-white/40':
              variant === 'secondary',
            'border border-black/15 dark:border-white/15 text-[#1D1D1F] dark:text-white hover:border-[#B89047]/50 hover:bg-[#FAF8F5] dark:hover:bg-white/5 shadow-sm':
              variant === 'outline',
            'text-[#B89047] dark:text-[#EAD29A] hover:bg-[#B89047]/10 transition-colors':
              variant === 'ghost',
            'h-8 px-4 text-xs tracking-tight': size === 'sm',
            'h-11 px-6 text-sm tracking-tight': size === 'md',
            'h-12 px-8 text-base tracking-tight': size === 'lg',
          },
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;
