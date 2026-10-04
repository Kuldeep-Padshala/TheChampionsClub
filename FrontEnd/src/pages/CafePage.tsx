import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { SectionHeader } from '../components/ui/SectionHeader';
import { MenuCard } from '../components/cafe/MenuCard';
import { MenuCategoryTabs } from '../components/cafe/MenuCategoryTabs';
import { getMenuItems } from '../services/menuService';
import { MenuItem } from '../types/menu.types';
import { useLoginPrompt } from '../hooks/useLoginPrompt';
import { Clock, Star, Percent, X, Plus, Minus, Utensils, CheckCircle2, RotateCw, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

export const CafePage = () => {
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'food' | 'drinks' | 'bar'>('food');
  const { requireLogin } = useLoginPrompt();

  // Table Order Modal State
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [orderQty, setOrderQty] = useState(1);
  const [tableLocation, setTableLocation] = useState('T-01 (INDOOR • 4 Seats)');
  const [diningTables, setDiningTables] = useState<Array<{ id: number; table_number: string; seats: number; zone: string; status: string }>>([]);
  const [specialNotes, setSpecialNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  useEffect(() => {
    getMenuItems().then(setMenu);
    api.get('/public/tables').then(res => {
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setDiningTables(res.data.data);
        const first = res.data.data[0];
        setTableLocation(`${first.table_number} (${first.zone.toUpperCase()} • ${first.seats} Seats)`);
      }
    }).catch(err => console.warn('[CafePage] tables error:', err));
  }, []);

  const filteredMenu = menu.filter(item => item.category === activeTab);

  const handleOpenOrder = (item: MenuItem) => {
    requireLogin('place a dining order', () => {
      setSelectedItem(item);
      setOrderQty(1);
      setSpecialNotes('');
    });
  };

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    setIsSubmittingOrder(true);
    try {
      const res = await api.post('/public/table-order', {
        item_id: selectedItem.id,
        item_name: selectedItem.name,
        quantity: orderQty,
        unit_price: selectedItem.price,
        table_location: tableLocation,
        notes: specialNotes,
      });

      const orderRef = res.data?.order_no || 'ORD-BAR-' + Date.now();
      toast.success(`Order confirmed (${orderRef}) for ${selectedItem.name}! Our waitstaff is delivering to ${tableLocation}.`, {
        duration: 5000,
        icon: '🍸',
      });
      setSelectedItem(null);
    } catch {
      toast.error('Unable to place table order. Please call the server.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  return (
    <PageLayout>
      {/* ── Page hero with background */}
      <div
        className="relative bg-black text-white pt-36 pb-20 md:pt-44 md:pb-28 bg-cover bg-center overflow-hidden"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?q=80&w=2000&auto=format&fit=crop')",
        }}
      >
        {/* Crystal Clear Dark Vignette Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/95 via-black/85 to-black/95 backdrop-blur-[2px]" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-[#B89047]/25 border border-[#B89047]/60 text-[#EAD29A] rounded-full px-4 py-1.5 text-xs sm:text-sm font-bold mb-6 shadow-lg backdrop-blur-md">
            <Star size={14} className="text-[#EAD29A] fill-[#EAD29A]/30" />
            <span>Member Privilege • 15% Preferential Dining & Cellar</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-bold text-white tracking-tight mb-4 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]">
            The Clubhouse <span className="text-[#EAD29A] drop-shadow-[0_2px_8px_rgba(234,210,154,0.3)]">Cafe &amp; Lounge</span>
          </h1>
          <p className="text-base sm:text-lg text-gray-200 max-w-2xl mx-auto leading-relaxed drop-shadow font-normal">
            Refuel post-match with artisanal nutrition or unwind with club reserves. Handcrafted culinary dishes, barista brews, and curated spirits.
          </p>
        </div>
      </div>

      {/* ── Menu section ── */}
      <div className="container mx-auto px-4 md:px-6 py-12">

        {/* Tab switcher: Food / Drinks / Bar */}
        <MenuCategoryTabs activeTab={activeTab} onChange={setActiveTab} />

        {/* Empty state if no items in category */}
        {filteredMenu.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400 border border-dashed border-black/10 dark:border-white/10 rounded-2xl">
            Menu items for this category are being updated. Check back soon!
          </div>
        ) : (
          /* 2-column menu grid on large screens */
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-5xl mx-auto">
            {filteredMenu.map(item => (
              <MenuCard
                key={item.id}
                item={item}
                onOrder={() => handleOpenOrder(item)}
              />
            ))}
          </div>
        )}

        {/* ── Info cards row at bottom ── */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {/* Opening hours */}
          <div className="bg-white dark:bg-[#121216] border border-black/10 dark:border-white/10 rounded-2xl p-6 flex gap-4 items-start shadow-sm transition-all hover:border-[#B89047]/30">
            <div className="w-10 h-10 bg-[#B89047]/10 dark:bg-[#B89047]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Clock className="text-[#B89047]" size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-[#1D1D1F] dark:text-white mb-2">Hours</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Cafe &amp; Kitchen: 7 AM – 10 PM<br />
                The Bar: 4 PM – 11:30 PM<br />
                (Extended on weekends)
              </p>
            </div>
          </div>

          {/* Member discount */}
          <div className="bg-[#B89047]/5 dark:bg-[#B89047]/10 border border-[#B89047]/25 rounded-2xl p-6 flex gap-4 items-start shadow-sm transition-all hover:border-[#B89047]/40">
            <div className="w-10 h-10 bg-[#B89047]/15 rounded-full flex items-center justify-center flex-shrink-0">
              <Percent className="text-[#B89047]" size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-[#1D1D1F] dark:text-white mb-2">Member Discount</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Gold members: 15% off<br />
                Silver members: 10% off<br />
                Applied automatically at checkout
              </p>
            </div>
          </div>

          {/* Tab / run a tab */}
          <div className="bg-white dark:bg-[#121216] border border-black/10 dark:border-white/10 rounded-2xl p-6 flex gap-4 items-start shadow-sm transition-all hover:border-[#B89047]/30">
            <div className="w-10 h-10 bg-[#B89047]/10 dark:bg-[#B89047]/20 rounded-full flex items-center justify-center flex-shrink-0">
              <Star className="text-[#B89047]" size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-[#1D1D1F] dark:text-white mb-2">Run a Tab</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                Gold members can run a monthly tab and settle at month-end. No carrying cash on the court.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Table & Lounge Order Confirmation Modal ── */}
      {selectedItem &&
        createPortal(
          <div
            data-lenis-prevent
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn"
          >
            <div className="relative w-full max-w-lg bg-[#121216] border border-[#B89047]/40 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-[#B89047]/20 border border-[#B89047]/30 flex items-center justify-center text-[#EAD29A]">
                  <Utensils size={18} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-white">
                    Confirm Table Order
                  </h3>
                  <p className="text-xs text-gray-400">
                    Kitchen order will be prepared and delivered to your designated table
                  </p>
                </div>
              </div>

              <form onSubmit={handleConfirmOrder} className="space-y-5">
                {/* Item dossier */}
                <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">{selectedItem.name}</h4>
                    <p className="text-xs text-gray-400 mt-0.5">{selectedItem.description}</p>
                  </div>
                  <div className="text-right flex-shrink-0 ml-4">
                    <div className="font-display font-bold text-base text-[#EAD29A]">
                      ₹{(selectedItem.price * (1 - (selectedItem.memberDiscount || 0) / 100)).toFixed(0)}
                    </div>
                    {selectedItem.memberDiscount && (
                      <div className="text-[10px] text-gray-400 line-through">₹{selectedItem.price}</div>
                    )}
                  </div>
                </div>

                {/* Quantity selector */}
                <div className="flex items-center justify-between py-2 border-b border-white/10">
                  <span className="text-xs font-semibold text-gray-300">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setOrderQty(Math.max(1, orderQty - 1))}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer border border-white/10"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="font-bold text-sm font-mono w-6 text-center">{orderQty}</span>
                    <button
                      type="button"
                      onClick={() => setOrderQty(orderQty + 1)}
                      className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-white flex items-center justify-center cursor-pointer border border-white/10"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                {/* Seating Location Selection */}
                <div>
                  <label className="block text-xs uppercase font-semibold text-gray-400 mb-1.5">
                    Dining & Lounge Location *
                  </label>
                  <select
                    value={tableLocation}
                    onChange={(e) => setTableLocation(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs font-semibold outline-none focus:border-[#B89047] cursor-pointer"
                  >
                    {diningTables.length > 0 ? (
                      diningTables.map((t) => (
                        <option
                          key={t.id}
                          value={`${t.table_number} (${t.zone.toUpperCase()} • ${t.seats} Seats)`}
                          className="bg-[#121216]"
                        >
                          {t.table_number} ({t.zone.toUpperCase()} • {t.seats} Seats {t.status === 'occupied' ? '• Occupied' : ''})
                        </option>
                      ))
                    ) : (
                      <option value="T-01 (INDOOR • 4 Seats)" className="bg-[#121216]">T-01 (INDOOR • 4 Seats)</option>
                    )}
                  </select>
                </div>

                {/* Special preparation instructions */}
                <div>
                  <label className="block text-xs uppercase font-semibold text-gray-400 mb-1.5">
                    Chef Preparation Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                    placeholder="e.g. Less spicy, extra lime, serve with hot water..."
                    className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] text-white text-xs outline-none focus:border-[#B89047]"
                  />
                </div>

                {/* Price Calculation breakdown */}
                {(() => {
                  const unitPrice = selectedItem.price * (1 - (selectedItem.memberDiscount || 0) / 100);
                  const subtotal = unitPrice * orderQty;
                  const gst = Math.round(subtotal * 0.10);
                  const total = subtotal + gst;
                  return (
                    <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1.5 text-xs">
                      <div className="flex justify-between text-gray-400">
                        <span>Subtotal ({orderQty} item{orderQty > 1 ? 's' : ''}):</span>
                        <span>₹{subtotal.toFixed(0)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>GST & Service Charge (10%):</span>
                        <span>₹{gst}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-white/10 font-bold text-white text-sm">
                        <span>Total Charged to Member Tab:</span>
                        <span className="text-[#EAD29A] font-mono">₹{total.toFixed(0)}</span>
                      </div>
                    </div>
                  );
                })()}

                <button
                  type="submit"
                  disabled={isSubmittingOrder}
                  className="w-full py-3 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#B89047] to-[#EAD29A] hover:brightness-105 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-lg shadow-[#B89047]/20"
                >
                  {isSubmittingOrder ? (
                    <>
                      <RotateCw size={15} className="animate-spin" />
                      <span>Routing to Kitchen KDS...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={16} />
                      <span>Confirm & Send to Kitchen</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>,
          document.body
        )}

    </PageLayout>
  );
};
