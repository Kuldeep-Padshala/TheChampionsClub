import React from 'react';
import { UtensilsCrossed, GlassWater, Beer } from 'lucide-react';
import { cn } from '../../utils/cn';

// The 3 tabs available in the Cafe & Bar page
const TABS = [
  { key: 'food'   as const, label: 'Food',       icon: UtensilsCrossed },
  { key: 'drinks' as const, label: 'Drinks',     icon: GlassWater      },
  { key: 'bar'    as const, label: 'Bar Specials', icon: Beer           },
];

interface MenuCategoryTabsProps {
  activeTab: 'food' | 'drinks' | 'bar';
  onChange: (tab: 'food' | 'drinks' | 'bar') => void;
}

export const MenuCategoryTabs: React.FC<MenuCategoryTabsProps> = ({ activeTab, onChange }) => {
  return (
    <div className="flex gap-2 mb-10 border-b border-border pb-0 overflow-x-auto">
      {TABS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            'flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap -mb-px',
            activeTab === key
              ? 'border-gold-primary text-gold-primary'
              : 'border-transparent text-text-secondary hover:text-navy-primary hover:border-border'
          )}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  );
};
