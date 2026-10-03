import React from 'react';
import { Product } from '../../types/shop.types';
import { SpotlightCard } from '../ui/SpotlightCard';
import { formatPrice } from '../../utils/priceUtils';
import { useTheme } from '../../context/ThemeContext';
import { ShoppingBag, Package, Sparkles, ChevronRight, Check } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ProductCardProps {
  product: Product;
  onBuy: () => void;
}

/**
 * ProductCard — Curated Pro Shop Luxury Gear Card
 * Inspired by Aceternity UI, ReactBits.dev, and Kokonut UI.
 */
export const ProductCard: React.FC<ProductCardProps> = ({ product, onBuy }) => {
  const { theme } = useTheme();
  const isNight = theme === 'night';
  const isOutOfStock = product.stock === 'out-of-stock';
  const isLowStock = product.stock === 'low-stock';

  return (
    <SpotlightCard
      className="group flex flex-col h-full cursor-pointer select-none"
      enableTilt={true}
      tiltIntensity={3}
      onClick={!isOutOfStock ? onBuy : undefined}
    >
      {/* ── Visual Showcase Pedestal ── */}
      <div className="relative h-60 w-full p-6 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#F9F8F6] to-[#F2EFE9] dark:from-[#141418] dark:to-[#0D0D10] border-b border-black/[0.05] dark:border-white/[0.06]">
        {/* Soft Radial Center Light */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(184,144,71,0.12)_0%,transparent_70%)] pointer-events-none"
        />

        {/* Product Image with Hover Spring Zoom & Fallback */}
        <img
          src={product.imageUrl}
          alt={product.name}
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?q=80&w=600&auto=format&fit=crop';
          }}
          className={cn(
            'max-h-48 max-w-full object-contain transition-transform duration-500 ease-[0.16,1,0.3,1] group-hover:scale-110 drop-shadow-md',
            isOutOfStock && 'opacity-40 grayscale'
          )}
        />

        {/* Top-Left: Brand Monogram Chip */}
        <div className="absolute top-4 left-4 z-20">
          <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-[0.2em] uppercase bg-black/60 dark:bg-black/70 backdrop-blur-md text-white border border-white/20 shadow-sm font-display">
            {product.brand}
          </span>
        </div>

        {/* Top-Right: Stock Status Pill */}
        <div className="absolute top-4 right-4 z-20">
          {isLowStock && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/35 backdrop-blur-md shadow-sm">
              Limited Reserve
            </span>
          )}
          {isOutOfStock && (
            <span className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/35 backdrop-blur-md shadow-sm">
              Sold Out
            </span>
          )}
        </div>
      </div>

      {/* ── Product Dossier ── */}
      <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
        <div>
          {/* Category Tag */}
          <span className="text-[10px] uppercase font-bold tracking-[0.22em] text-[#B89047] block mb-1.5">
            Tour Equipment • {product.category}
          </span>

          {/* Product Name */}
          <h3 className="text-xl font-display font-bold tracking-tight text-[#1D1D1F] dark:text-white line-clamp-2 group-hover:text-[#B89047] transition-colors duration-300 mb-2">
            {product.name}
          </h3>

          <p className="text-xs text-[#71717A] dark:text-[#A1A1A6] mb-5">
            Engineered for elite {product.sport} performance and durability.
          </p>
        </div>

        <div>
          {/* ── Pricing Matrix ── */}
          <div className="rounded-xl p-3.5 bg-[#FAF9F6] dark:bg-[#121216] border border-black/[0.05] dark:border-white/[0.06] mb-5">
            {product.memberPrice ? (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#86868B]">
                    Regular Price
                  </span>
                  <span className="text-xs text-[#86868B] line-through font-mono">
                    {formatPrice(product.price)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-black/[0.05] dark:border-white/[0.06]">
                  <span className="text-xs font-bold text-[#B89047] flex items-center gap-1">
                    <Sparkles size={12} /> Member Price
                  </span>
                  <span className="text-lg font-bold text-[#1D1D1F] dark:text-white font-display">
                    {formatPrice(product.memberPrice)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#86868B]">Price</span>
                <span className="text-lg font-bold text-[#1D1D1F] dark:text-white font-display">
                  {formatPrice(product.price)}
                </span>
              </div>
            )}
          </div>

          {/* ── Action CTA Button ── */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isOutOfStock) onBuy();
            }}
            disabled={isOutOfStock}
            className={cn(
              'w-full h-11 rounded-full font-semibold text-xs tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 relative overflow-hidden group/btn active:scale-[0.98]',
              isOutOfStock
                ? 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 cursor-not-allowed border border-transparent'
                : isNight
                ? 'bg-[#18181D] hover:bg-[#22222A] text-white border border-[#B89047]/45 hover:border-[#B89047] shadow-md hover:shadow-[0_0_20px_rgba(184,144,71,0.3)]'
                : 'bg-[#121214] hover:bg-black text-white border border-[#B89047]/40 shadow-sm hover:shadow-[0_8px_20px_-6px_rgba(184,144,71,0.3)]'
            )}
          >
            {/* Shimmer Light Reflection Sweep */}
            {!isOutOfStock && (
              <div className="absolute inset-0 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent ease-out pointer-events-none" />
            )}

            {isOutOfStock ? (
              <>
                <Package size={14} />
                <span>Currently Unavailable</span>
              </>
            ) : (
              <>
                <ShoppingBag size={14} className="text-[#EAD29A] flex-shrink-0" />
                <span className="relative z-10 font-display">Acquire In Pro Shop</span>
                <ChevronRight size={13} className="group-hover/btn:translate-x-1 transition-transform relative z-10" />
              </>
            )}
          </button>
        </div>
      </div>
    </SpotlightCard>
  );
};

export default ProductCard;
