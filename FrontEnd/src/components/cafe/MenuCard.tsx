import React from 'react';
import { MenuItem } from '../../types/menu.types';
import { formatPrice } from '../../utils/priceUtils';
import { SpotlightCard } from '../ui/SpotlightCard';
import { useTheme } from '../../context/ThemeContext';
import { Leaf, Utensils, Sparkles, Plus, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MenuCardProps {
  item: MenuItem;
  onOrder: () => void;
}

/**
 * MenuCard — Haute Gastronomie & Clubhouse Social Lounge Dish Card
 * Inspired by Aceternity UI, ReactBits.dev, and Kokonut UI.
 */
export const MenuCard: React.FC<MenuCardProps> = ({ item, onOrder }) => {
  const { theme } = useTheme();
  const isNight = theme === 'night';
  const memberPrice = item.memberDiscount
    ? Math.round(item.price * (1 - item.memberDiscount / 100))
    : null;

  return (
    <SpotlightCard
      className="group p-5 sm:p-6 flex flex-col justify-between h-full cursor-pointer select-none"
      enableTilt={true}
      tiltIntensity={2.5}
      onClick={onOrder}
    >
      <div>
        {/* ── Top Row: Dietary Status & Culinary Indicator ── */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            {/* Jewel Dietary Indicator */}
            <div
              className={cn(
                'w-4 h-4 rounded-sm flex items-center justify-center p-[2px] border transition-colors',
                item.isVeg
                  ? 'border-emerald-600 dark:border-emerald-400 bg-emerald-500/10'
                  : 'border-rose-600 dark:border-rose-400 bg-rose-500/10'
              )}
            >
              <div
                className={cn(
                  'w-2 h-2 rounded-full',
                  item.isVeg ? 'bg-emerald-600 dark:bg-emerald-400' : 'bg-rose-600 dark:bg-rose-400'
                )}
              />
            </div>

            <span className="text-[10px] uppercase font-bold tracking-[0.18em] text-[#86868B]">
              {item.isVeg ? 'Plant Based' : 'Chef Special'}
            </span>
          </div>

          {/* Member Savings Pill */}
          {item.memberDiscount && (
            <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight bg-[#B89047]/15 text-[#997332] dark:text-[#EAD29A] border border-[#B89047]/30 flex items-center gap-1">
              <Sparkles size={10} />
              {item.memberDiscount}% Member Privilege
            </span>
          )}
        </div>

        {/* ── Dish Name & Description ── */}
        <h3 className="font-display text-lg sm:text-xl font-bold text-[#1D1D1F] dark:text-white group-hover:text-[#B89047] transition-colors duration-300 mb-2 leading-snug">
          {item.name}
        </h3>

        <p className="text-xs sm:text-sm text-[#71717A] dark:text-[#A1A1A6] leading-relaxed line-clamp-2 mb-5">
          {item.description}
        </p>
      </div>

      {/* ── Pricing & Concierge Ordering ── */}
      <div className="pt-4 border-t border-black/[0.05] dark:border-white/[0.06] flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-bold font-display text-[#1D1D1F] dark:text-white">
              {formatPrice(memberPrice || item.price)}
            </span>
            {memberPrice && (
              <span className="text-xs text-[#86868B] line-through font-mono">
                {formatPrice(item.price)}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#86868B] block mt-0.5">
            {memberPrice ? 'Member Rate' : 'Standard Rate'}
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOrder();
          }}
          className={cn(
            'px-4 py-2 rounded-full font-semibold text-xs tracking-wider uppercase transition-all duration-300 flex items-center gap-1.5 active:scale-95 shadow-sm',
            isNight
              ? 'bg-[#18181D] hover:bg-[#22222A] text-white border border-[#B89047]/45 hover:border-[#B89047]'
              : 'bg-[#121214] hover:bg-black text-white border border-[#B89047]/40'
          )}
        >
          <span>Order</span>
          <Plus size={13} className="text-[#EAD29A]" />
        </button>
      </div>
    </SpotlightCard>
  );
};

export default MenuCard;
