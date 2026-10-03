import React from 'react';
import { cn } from '../../utils/cn';

interface CategoryFilterProps {
  // Array of category strings e.g. ['all', 'rackets', 'balls', ...]
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
}

/**
 * CategoryFilter — horizontal pill filter bar for the Shop page.
 * Renders each category as a clickable rounded pill button.
 * Active pill has gold background + white text.
 */
export const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  activeCategory,
  onSelect,
}) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {categories.map(cat => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          className={cn(
            'px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-all capitalize flex-shrink-0',
            activeCategory === cat
              ? 'bg-gold-primary text-white shadow-sm'
              : 'bg-white border border-border text-navy-mid hover:bg-gold-primary/10 hover:border-gold-primary/30 hover:text-navy-primary'
          )}
        >
          {cat === 'all' ? 'All Gear' : cat}
        </button>
      ))}
    </div>
  );
};
