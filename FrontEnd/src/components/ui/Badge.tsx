import React from 'react';
import { cn } from '../../utils/cn';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'navy' | 'success' | 'warning' | 'danger' | 'default';
  className?: string;
}

/**
 * Badge — small label pill used for sport types, stock status, plan labels.
 *
 * Variants:
 *   gold    — gold background, white text (primary accent)
 *   navy    — navy background, white text
 *   success — green (available, in-stock)
 *   warning — amber (low stock, social play)
 *   danger  — red (booked, out-of-stock)
 *   default — gray (neutral)
 */
export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  className,
}) => {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        {
          'bg-gold-primary text-white':           variant === 'gold',
          'bg-navy-primary text-white':           variant === 'navy',
          'bg-green-100 text-green-800 border border-green-200': variant === 'success',
          'bg-amber-100 text-amber-800 border border-amber-200': variant === 'warning',
          'bg-red-100 text-red-800 border border-red-200':       variant === 'danger',
          'bg-bg-subtle text-navy-mid border border-border':     variant === 'default',
        },
        className
      )}
    >
      {children}
    </span>
  );
};
