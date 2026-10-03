import React from 'react';
import { MenuItem } from '../../types/menu.types';
import { Button } from '../ui/Button';
import { formatPrice } from '../../utils/priceUtils';
import { Leaf, ShoppingCart } from 'lucide-react';

interface MenuCardProps {
  item: MenuItem;
  onOrder: () => void;
}

export const MenuCard: React.FC<MenuCardProps> = ({ item, onOrder }) => {
  return (
    <div className="bg-bg-surface border border-border rounded-xl p-5 flex gap-4 hover:shadow-sm hover:border-gold-light/50 transition-all group">

      {/* ── Veg / Non-veg indicator (Indian food standard) ── */}
      <div className="flex-shrink-0 pt-0.5">
        <div
          className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${
            item.isVeg
              ? 'border-green-600 bg-green-50'
              : 'border-red-600 bg-red-50'
          }`}
          title={item.isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
        >
          <div
            className={`w-2 h-2 rounded-full ${
              item.isVeg ? 'bg-green-600' : 'bg-red-600'
            }`}
          />
        </div>
      </div>

      {/* ── Item info ── */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-navy-primary text-sm leading-snug">{item.name}</h3>
          {/* Veg label badge */}
          {item.isVeg && (
            <span className="flex-shrink-0 flex items-center gap-0.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
              <Leaf size={10} />
              Veg
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3">
          {item.description}
        </p>

        {/* ── Pricing row ── */}
        <div className="flex items-center justify-between">
          <div>
            <span className="font-bold text-navy-primary">{formatPrice(item.price)}</span>
            {item.memberDiscount && (
              <span className="ml-2 text-xs text-gold-primary font-medium">
                Members: {formatPrice(Math.round(item.price * (1 - item.memberDiscount / 100)))}
              </span>
            )}
          </div>

          {/* Order CTA */}
          <Button
            size="sm"
            variant="outline"
            onClick={onOrder}
            className="gap-1.5 text-xs"
          >
            <ShoppingCart size={12} />
            Order
          </Button>
        </div>
      </div>
    </div>
  );
};
