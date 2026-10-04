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
    <div className={cn(centered ? 'text-center flex flex-col items-center' : 'text-left', 'mb-10 md:mb-14', className)}>
      {/* Main heading in Apple typography */}
      <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold text-[#1D1D1F] tracking-tight leading-[1.08] mb-3 md:mb-4">
        {title}
      </h2>

      {/* Apple subtitle */}
      {subtitle && (
        <p className={cn(
          'text-[#86868B] text-base md:text-xl font-normal leading-relaxed',
          centered ? 'max-w-2xl text-center mx-auto' : 'max-w-xl'
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
