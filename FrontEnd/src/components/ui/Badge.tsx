import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'navy' | 'success' | 'warning' | 'danger' | 'default';
  className?: string;
}

/**
 * Badge — Luxury Jewel Pill Status & Tag Component
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-0.5 text-[10.5px] font-bold tracking-wider uppercase backdrop-blur-md shadow-sm border transition-colors font-display',
        {
          'bg-gradient-to-r from-[#B89047] via-[#EAD29A] to-[#B89047] text-[#0A0A0D] border-white/40 shadow-[0_2px_8px_rgba(184,144,71,0.25)]':
            variant === 'gold',
          'bg-[#121214] text-white border-[#B89047]/40':
            variant === 'navy',
          'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30':
            variant === 'success',
          'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30':
            variant === 'warning',
          'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30':
            variant === 'danger',
          'bg-[#FAF8F5] dark:bg-white/[0.05] text-[#1D1D1F] dark:text-[#E5E5EA] border-black/[0.06] dark:border-white/10':
            variant === 'default',
        },
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
