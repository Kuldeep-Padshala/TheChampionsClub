import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { ProductCard } from '../components/shop/ProductCard';
import { CategoryFilter } from '../components/shop/CategoryFilter';
import { getProducts } from '../services/shopService';
import { Product } from '../types/shop.types';
import { useLoginPrompt } from '../hooks/useLoginPrompt';
import { memberService } from '../services/memberService';
import { Modal } from '../components/ui/Modal';
import { formatPrice } from '../utils/priceUtils';
import { ROUTES } from '../constants/routes';
import toast from 'react-hot-toast';
import {
  Percent,
  Truck,
  ShoppingBag,
  Plus,
  Minus,
  PackageCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

// Category and sport filter option lists
const CATEGORIES = ['all', 'rackets', 'balls', 'shoes', 'accessories', 'apparel'];
const SPORTS = ['all', 'tennis', 'cricket', 'badminton', 'general'];

export const ShopPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSport, setActiveSport] = useState('all');
  const { requireLogin, user, isAuthenticated } = useLoginPrompt();

  // Member Direct Checkout Modal state
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderQuantity, setOrderQuantity] = useState(1);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  useEffect(() => {
    getProducts().then(setProducts);
  }, []);

  // Apply category and sport filters
  const filteredProducts = products.filter((p) => {
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchSport = activeSport === 'all' || p.sport === activeSport;
    return matchCategory && matchSport;
  });

  const handleBuy = (product: Product) => {
    requireLogin('purchase this luxury item', () => {
      // If user is staff, inform them to use the receptionist POS
      if (user?.roles?.includes('FRONT_DESK')) {
        toast.error('Front Desk accounts manage equipment orders via the Reception POS terminal.');
        return;
      }

      // Member authenticated: open direct acquisition modal
      setSelectedProduct(product);
      setOrderQuantity(1);
      setIsOrderModalOpen(true);
    });
  };

  const handleConfirmOrder = async () => {
    if (!selectedProduct) return;
    setIsPlacingOrder(true);
    try {
      const unitPrice = selectedProduct.memberPrice || selectedProduct.price;
      const res = await memberService.placeOrder({
        items: [
          {
            product_name: selectedProduct.name,
            quantity: orderQuantity,
            unit_price: unitPrice,
          },
        ],
        notes: `Online Pro Shop order for ${selectedProduct.name} (${selectedProduct.brand})`,
      });

      toast.success(
        `Order placed successfully! Order #${res.order_no} is ready for pickup at the Pro Counter.`,
        { duration: 5000 }
      );
      setIsOrderModalOpen(false);
    } catch (err: any) {
      console.error('[ShopPage] Purchase error:', err);
      toast.error(err?.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsPlacingOrder(false);
    }
  };

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
            Premium gear for serious players. Members enjoy exclusive preferential rates —
            available for touchless in-club counter pickup.
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
              Free pickup preparation for active members
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
              {SPORTS.map((s) => (
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
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onBuy={() => handleBuy(product)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Member Direct Acquisition Modal ── */}
      <Modal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)}>
        {selectedProduct && (
          <div className="space-y-6">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold tracking-[0.22em] text-[#B89047] block mb-1">
                The Champions Club • Official Pro Shop
              </span>
              <h3 className="text-2xl font-display font-bold text-[#1D1D1F] dark:text-white">
                Acquire Tour Equipment
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Exclusive member rate applied with priority counter pickup
              </p>
            </div>

            {/* Product Highlight Box */}
            <div className="p-4 rounded-2xl bg-[#FAF9F6] dark:bg-[#141418] border border-black/[0.06] dark:border-white/10 flex items-center gap-4">
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.name}
                className="w-16 h-16 object-contain rounded-xl bg-white dark:bg-black/40 p-1 border border-black/5"
              />
              <div className="flex-1 min-w-0">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-[#B89047]/15 text-[#B89047]">
                  {selectedProduct.brand}
                </span>
                <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white truncate mt-1">
                  {selectedProduct.name}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[#86868B] line-through">
                    {formatPrice(selectedProduct.price)}
                  </span>
                  <span className="text-sm font-bold text-[#B89047] font-display flex items-center gap-1">
                    <Sparkles size={11} />
                    {formatPrice(selectedProduct.memberPrice || selectedProduct.price)}
                  </span>
                </div>
              </div>
            </div>

            {/* Quantity Selector */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-[#121216] border border-black/[0.06] dark:border-white/10">
              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                  Order Quantity
                </span>
                <span className="text-[10px] text-gray-400">Select units to reserve</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:border-[#B89047] active:scale-95 transition-all text-gray-700 dark:text-gray-300"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-bold w-5 text-center text-[#1D1D1F] dark:text-white">
                  {orderQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setOrderQuantity(orderQuantity + 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:border-[#B89047] active:scale-95 transition-all text-gray-700 dark:text-gray-300"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Order Total */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
              <div>
                <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold block">
                  Total Member Cost
                </span>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">
                  Ready for collection at the Pro Shop counter
                </p>
              </div>
              <span className="text-xl font-bold font-display text-emerald-700 dark:text-emerald-300">
                {formatPrice((selectedProduct.memberPrice || selectedProduct.price) * orderQuantity)}
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isPlacingOrder}
                className="w-full h-12 rounded-xl text-sm font-semibold bg-[#121214] text-white hover:bg-[#B89047] dark:bg-[#B89047] dark:hover:bg-[#A67C38] dark:text-black transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
              >
                {isPlacingOrder ? (
                  <span>Reserving Equipment...</span>
                ) : (
                  <>
                    <PackageCheck size={16} />
                    <span>Confirm &amp; Place Pickup Order</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="w-full h-10 rounded-xl text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </Modal>
    </PageLayout>
  );
};
