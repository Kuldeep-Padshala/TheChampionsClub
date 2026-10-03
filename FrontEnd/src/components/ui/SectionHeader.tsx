import React from 'react';
import { cn } from '../../utils/cn';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

/**
 * SectionHeader — consistent section title + optional subtitle.
 * Used at the top of every content section across all pages.
 *
 * Props:
 *   title    — main heading (Playfair Display, navy)
 *   subtitle — optional gray subtext below
 *   centered — if true, text is center-aligned
 *   className — extra Tailwind classes
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  centered = false,
  className,
}) => {
  return (
    <div className={cn(centered ? 'text-center flex flex-col items-center' : 'text-left', 'mb-8 animate-fade-in-up', className)}>
      {/* Gold decorative line — shown above the title */}
      <div className={cn(
        'w-12 h-0.5 bg-gold-primary rounded-full mb-6',
        centered ? 'mx-auto' : ''
      )} />

      {/* Main heading */}
      <h2 className="font-display text-4xl md:text-5xl text-navy-primary leading-tight mb-4 tracking-tight">
        {title}
      </h2>

      {/* Optional subtitle */}
      {subtitle && (
        <p className={cn(
          'text-text-secondary text-base md:text-lg leading-relaxed font-light',
          centered ? 'max-w-2xl text-center mx-auto' : 'max-w-xl'
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
