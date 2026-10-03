import React from 'react';
import { cn } from '../../utils/cn';

interface CategoryFilterProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

/**
 * CategoryFilter — Haute Couture pill filter bar for the Pro Shop
 */
export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onSelect,
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {categories.map((cat) => {
        const isActive = activeCategory === cat;
        return (
          <button
            key={cat}
            onClick={() => onSelect(cat)}
            className={cn(
              'px-5 py-2 text-xs font-semibold rounded-full whitespace-nowrap transition-all capitalize flex-shrink-0 active:scale-95 shadow-sm font-display tracking-wide',
              isActive
                ? 'bg-[#121214] text-white dark:bg-gradient-to-r dark:from-[#EAD29A] dark:via-[#B89047] dark:to-[#B89047] dark:text-black border border-[#B89047]/60 shadow-[0_4px_12px_rgba(184,144,71,0.25)]'
                : 'bg-white/90 dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/10 text-[#66666E] dark:text-[#A1A1A6] hover:border-[#B89047]/45 hover:text-[#1D1D1F] dark:hover:text-white backdrop-blur-md'
            )}
          >
            {cat === 'all' ? 'All Gear' : cat}
          </button>
        );
      })}
    </div>
  );
};

export default CategoryFilter;
