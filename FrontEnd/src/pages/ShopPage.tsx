import React, { useEffect, useState } from 'react';
import { PageLayout } from '../components/layout/PageLayout';
import { SectionHeader } from '../components/ui/SectionHeader';
import { ProductCard } from '../components/shop/ProductCard';
import { CategoryFilter } from '../components/shop/CategoryFilter';
import { getProducts } from '../services/shopService';
import { Product } from '../types/shop.types';
import { useLoginPrompt } from '../hooks/useLoginPrompt';
import { Percent, Truck, ShoppingBag } from 'lucide-react';

// Category and sport filter option lists
const CATEGORIES = ['all', 'rackets', 'balls', 'shoes', 'accessories', 'apparel'];
const SPORTS = ['all', 'tennis', 'cricket', 'badminton', 'general'];

export const ShopPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSport, setActiveSport] = useState('all');
  const { requireLogin } = useLoginPrompt();

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  // Apply category and sport filters
  const filteredProducts = products.filter(p => {
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchSport = activeSport === 'all' || p.sport === activeSport;
    return matchCategory && matchSport;
  });

  return (
    <PageLayout>

      {/* ── Page hero ── */}
      <div className="bg-navy-primary text-cream pt-36 pb-20 md:pt-44 md:pb-28 relative overflow-hidden">
        {/* Decorative large icon in background */}
        <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <ShoppingBag size={500} />
        </div>
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-gold-primary mb-4">
            Pro Shop
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl mx-auto">
            Premium gear for serious players. Members enjoy up to 20% off all purchases —
            available for in-store pickup or home delivery.
          </p>
        </div>
      </div>

      {/* ── Member discount banner ── */}
      <div className="bg-gold-primary/10 border-y border-gold-primary/20">
        <div className="container mx-auto px-4 md:px-6 py-3">
          <div className="flex flex-wrap justify-center gap-8 text-sm font-medium text-navy-primary">
            <span className="flex items-center gap-2">
              <Percent size={14} className="text-gold-primary" />
              Gold Members: 20% off all products
            </span>
            <span className="flex items-center gap-2">
              <Percent size={14} className="text-gold-primary" />
              Silver &amp; Junior Members: 10% off
            </span>
            <span className="flex items-center gap-2">
              <Truck size={14} className="text-gold-primary" />
              Free delivery for members on orders over ₹2,000
            </span>
          </div>
        </div>
      </div>

      {/* ── Filter bar + product grid ── */}
      <div className="container mx-auto px-4 md:px-6 py-12">

        {/* Filters row */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          {/* Category pills */}
          <div>
            <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2">Gear Type</p>
            <CategoryFilter
              categories={CATEGORIES}
              activeCategory={activeCategory}
              onSelect={setActiveCategory}
            />
          </div>
          {/* Sport dropdown */}
          <div>
            <p className="text-xs text-text-secondary font-semibold uppercase tracking-wider mb-2">Sport</p>
            <select
              value={activeSport}
              onChange={(e) => setActiveSport(e.target.value)}
              className="w-full md:w-44 p-2.5 rounded-lg border border-border bg-white text-navy-primary text-sm focus:ring-2 focus:ring-gold-primary outline-none capitalize cursor-pointer"
            >
              {SPORTS.map(s => (
                <option key={s} value={s} className="capitalize">
                  {s === 'all' ? 'All Sports' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-text-secondary mb-6">
          Showing <span className="font-semibold text-navy-primary">{filteredProducts.length}</span> products
        </p>

        {/* Empty state */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-text-secondary border border-dashed border-border rounded-xl">
            No products found matching your filters. Try a different combination.
          </div>
        ) : (
          /* Product grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onBuy={() => requireLogin('purchase this item')}
              />
            ))}
          </div>
        )}
      </div>

    </PageLayout>
  );
};
