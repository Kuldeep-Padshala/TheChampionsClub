import React from 'react';
import { UtensilsCrossed, GlassWater, Beer } from 'lucide-react';
import { cn } from '../../utils/cn';

const TABS = [
  { key: 'food'   as const, label: 'Culinary Dishes',   icon: UtensilsCrossed },
  { key: 'drinks' as const, label: 'Artisan Beverages', icon: GlassWater      },
  { key: 'bar'    as const, label: 'Private Cellar & Bar', icon: Beer         },
];

interface MenuCategoryTabsProps {
  activeTab: 'food' | 'drinks' | 'bar';
  onChange: (tab: 'food' | 'drinks' | 'bar') => void;
}

export const MenuCategoryTabs: React.FC<MenuCategoryTabsProps> = ({ activeTab, onChange }) => {
  return (
    <div className="flex gap-2 sm:gap-4 mb-10 border-b border-black/[0.06] dark:border-white/[0.08] pb-0 overflow-x-auto scrollbar-hide">
      {TABS?.map(({ key, label, icon: Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            className={cn(
              'flex items-center gap-2.5 px-5 py-3.5 text-sm font-semibold border-b-2 transition-all whitespace-nowrap -mb-px font-display tracking-tight select-none',
              isActive
                ? 'border-[#B89047] text-[#B89047] dark:text-[#EAD29A]'
                : 'border-transparent text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:border-black/10 dark:hover:border-white/10'
            )}
          >
            <Icon size={16} className={isActive ? 'text-[#B89047]' : 'text-[#86868B]'} />
            <span>{label}</span>
            {isActive && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#B89047] shadow-[0_0_8px_rgba(184,144,71,0.8)]" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default MenuCategoryTabs;
