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
import { cn } from '../utils/cn';
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
  CreditCard,
} from 'lucide-react';
import { paymentService } from '../services/paymentService';

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
  const [fulfillmentMethod, setFulfillmentMethod] = useState<'counter' | 'locker'>('counter');
  const [deliveryNotes, setDeliveryNotes] = useState('');
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
      setFulfillmentMethod('counter');
      setDeliveryNotes('');
      setIsOrderModalOpen(true);
    });
  };

  const handleConfirmOrder = async () => {
    if (!selectedProduct) return;
    setIsPlacingOrder(true);
    try {
      const unitPrice = selectedProduct.memberPrice || selectedProduct.price;
      const fulfillmentText = fulfillmentMethod === 'locker' ? 'VIP Locker Delivery' : 'In-Club Counter Pickup';
      const notesCombined = `${fulfillmentText}. ${deliveryNotes.trim() ? `Instructions: ${deliveryNotes.trim()}` : ''} (Item: ${selectedProduct.name}, Brand: ${selectedProduct.brand})`;
      
      const res = await memberService.placeOrder({
        items: [
          {
            product_name: selectedProduct.name,
            quantity: orderQuantity,
            unit_price: unitPrice,
          },
        ],
        notes: notesCombined,
      });

      toast.success(
        `Order confirmed! Order #${res.order_no} logged for ${fulfillmentText.toLowerCase()}.`,
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

  const handlePayWithRazorpay = async () => {
    if (!selectedProduct) return;
    setIsPlacingOrder(true);
    try {
      const unitPrice = selectedProduct.memberPrice || selectedProduct.price;
      const subtotal = unitPrice * orderQuantity;
      const gst = Math.round(subtotal * 0.18);
      const grandTotal = subtotal + gst;
      const fulfillmentText = fulfillmentMethod === 'locker' ? 'VIP Locker Delivery' : 'In-Club Counter Pickup';

      await paymentService.openCheckout({
        amount: grandTotal,
        productName: `${selectedProduct.name} (${orderQuantity}x)`,
        customerName: user?.name || 'Club Member',
        customerEmail: user?.email || '',
        onSuccess: async (payResp) => {
          const notesCombined = `[Paid via Razorpay: ${payResp.payment_id}] ${fulfillmentText}. ${deliveryNotes.trim() ? `Instructions: ${deliveryNotes.trim()}` : ''}`;
          const res = await memberService.placeOrder({
            items: [
              {
                product_name: selectedProduct.name,
                quantity: orderQuantity,
                unit_price: unitPrice,
              },
            ],
            notes: notesCombined,
          });
          toast.success(`Payment verified & Order #${res.order_no} placed!`, { duration: 5000 });
          setIsOrderModalOpen(false);
          setIsPlacingOrder(false);
        },
        onError: (err) => {
          setIsPlacingOrder(false);
          if (err?.message !== 'Payment modal closed by user') {
            toast.error(err?.message || 'Razorpay payment could not be completed');
          }
        },
      });
    } catch (err: any) {
      console.error('[ShopPage] Razorpay error:', err);
      toast.error('Could not initiate Razorpay payment');
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
      <div className="bg-[#B89047]/10 dark:bg-[#B89047]/15 border-y border-[#B89047]/20">
        <div className="container mx-auto px-4 md:px-6 py-3.5">
          <div className="flex flex-wrap justify-center gap-6 sm:gap-8 text-xs sm:text-sm font-medium text-[#1D1D1F] dark:text-[#EAD29A]">
            <span className="flex items-center gap-2">
              <Percent size={14} className="text-[#B89047]" />
              Gold Members: 20% off all products
            </span>
            <span className="flex items-center gap-2">
              <Percent size={14} className="text-[#B89047]" />
              Silver &amp; Junior Members: 10% off
            </span>
            <span className="flex items-center gap-2">
              <Truck size={14} className="text-[#B89047]" />
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
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2 font-display">Gear Type</p>
            <CategoryFilter
              categories={CATEGORIES}
              activeCategory={activeCategory}
              onSelect={setActiveCategory}
            />
          </div>
          {/* Sport dropdown */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wider mb-2 font-display">Sport</p>
            <select
              value={activeSport}
              onChange={(e) => setActiveSport(e.target.value)}
              className="w-full md:w-44 p-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#141418] text-[#1D1D1F] dark:text-white text-xs font-semibold focus:ring-2 focus:ring-[#B89047] outline-none capitalize cursor-pointer shadow-sm"
            >
              {SPORTS?.map((s) => (
                <option key={s} value={s} className="capitalize bg-white dark:bg-[#141418] text-[#1D1D1F] dark:text-white">
                  {s === 'all' ? 'All Sports' : s.charAt(0).toUpperCase() + s.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Results count */}
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Showing <span className="font-semibold text-[#1D1D1F] dark:text-[#EAD29A]">{filteredProducts.length}</span> products
        </p>

        {/* Empty state */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 text-text-secondary border border-dashed border-border rounded-xl">
            No products found matching your filters. Try a different combination.
          </div>
        ) : (
          /* Product grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts?.map((product) => (
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
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-[#121216] border border-black/[0.06] dark:border-white/10">
              <div>
                <span className="text-xs font-semibold text-[#1D1D1F] dark:text-gray-300 block">
                  Order Quantity
                </span>
                <span className="text-[10px] text-gray-500">Select units to reserve</span>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setOrderQuantity(Math.max(1, orderQuantity - 1))}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:border-[#B89047] active:scale-95 transition-all text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-bold w-5 text-center text-[#1D1D1F] dark:text-white font-mono">
                  {orderQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setOrderQuantity(orderQuantity + 1)}
                  className="w-8 h-8 rounded-full border border-gray-300 dark:border-gray-700 flex items-center justify-center hover:border-[#B89047] active:scale-95 transition-all text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>

            {/* Fulfillment Channel Selection */}
            <div>
              <label className="block text-[11px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1.5">
                Collection &amp; Fulfillment Method
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFulfillmentMethod('counter')}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1',
                    fulfillmentMethod === 'counter'
                      ? 'border-[#B89047] bg-[#B89047]/10 text-[#1D1D1F] dark:text-white font-semibold'
                      : 'border-black/10 dark:border-white/10 text-gray-500 hover:border-black/20 dark:hover:border-white/20'
                  )}
                >
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Pro Desk Pickup
                  </span>
                  <span className="text-[10px] text-gray-400">Immediate touchless collection</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentMethod('locker')}
                  className={cn(
                    'p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1',
                    fulfillmentMethod === 'locker'
                      ? 'border-[#B89047] bg-[#B89047]/10 text-[#1D1D1F] dark:text-white font-semibold'
                      : 'border-black/10 dark:border-white/10 text-gray-500 hover:border-black/20 dark:hover:border-white/20'
                  )}
                >
                  <span className="text-xs font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#B89047]" /> VIP Locker Delivery
                  </span>
                  <span className="text-[10px] text-gray-400">Assigned locker upon arrival</span>
                </button>
              </div>
            </div>

            {/* Special Instructions / Notes */}
            <div>
              <label className="block text-[11px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400 mb-1">
                Fulfillment Instructions (Optional)
              </label>
              <input
                type="text"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                placeholder="e.g. Grip size preference, string tension, locker #..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-black/10 dark:border-white/10 bg-gray-50 dark:bg-black/30 text-xs text-[#1D1D1F] dark:text-white outline-none focus:border-[#B89047]"
              />
            </div>

            {/* Item Subtotal, Taxes & Grand Total Breakdown */}
            {(() => {
              const unitPrice = selectedProduct.memberPrice || selectedProduct.price;
              const subtotal = unitPrice * orderQuantity;
              const gst = Math.round(subtotal * 0.18);
              const grandTotal = subtotal + gst;
              return (
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#121216] border border-black/10 dark:border-white/10 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Equipment Subtotal ({orderQuantity} unit{orderQuantity > 1 ? 's' : ''}):</span>
                    <span className="font-mono font-semibold text-[#1D1D1F] dark:text-white">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>GST @ 18% (Sports Merchandise):</span>
                    <span className="font-mono font-semibold text-[#1D1D1F] dark:text-white">{formatPrice(gst)}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-black/10 dark:border-white/10 font-bold text-sm">
                    <span className="text-[#1D1D1F] dark:text-white">Total Amount Due:</span>
                    <span className="font-display text-base text-[#B89047] dark:text-[#EAD29A]">{formatPrice(grandTotal)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Actions */}
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handlePayWithRazorpay}
                disabled={isPlacingOrder}
                className="w-full h-12 rounded-xl text-sm font-bold bg-gradient-to-r from-[#EAD29A] via-[#B89047] to-[#A67C38] text-black hover:brightness-105 active:scale-98 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 cursor-pointer"
              >
                <CreditCard size={16} />
                <span>{isPlacingOrder ? 'Connecting Gateway...' : 'Pay with Razorpay (Instant Checkout)'}</span>
              </button>

              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isPlacingOrder}
                className="w-full h-11 rounded-xl text-xs font-semibold border border-black/15 dark:border-white/15 text-[#1D1D1F] dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <PackageCheck size={15} />
                <span>Reserve Now &amp; Pay In-Club</span>
              </button>

              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="w-full h-8 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors cursor-pointer"
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
