import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { barService } from '../services/barService';
import {
  BarCategory,
  BarMenuItem,
  DiningTable,
  BarTab,
  BarOrder,
  BarStats,
} from '../types/bar.types';
import {
  Coffee,
  UtensilsCrossed,
  LayoutGrid,
  CheckCircle2,
  Clock,
  RotateCw,
  Plus,
  Minus,
  Trash2,
  Search,
  Check,
  X,
  CreditCard,
  DollarSign,
  Users,
  AlertTriangle,
  Receipt,
  Sparkles,
  ChevronRight,
  Send,
  SlidersHorizontal,
  Flame,
  Wine,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

interface CartItem {
  menu_item: BarMenuItem;
  quantity: number;
  special_instructions: string;
}

export const BarStaffPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isNight = theme === 'night';

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as 'pos' | 'kds' | 'tables' | 'menu' | null;

  const [activeTab, setActiveTab] = useState<'pos' | 'kds' | 'tables' | 'menu'>(
    urlTab && ['pos', 'kds', 'tables', 'menu'].includes(urlTab) ? urlTab : 'pos'
  );

  useEffect(() => {
    if (urlTab && ['pos', 'kds', 'tables', 'menu'].includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab, activeTab]);

  const handleTabChange = (tab: 'pos' | 'kds' | 'tables' | 'menu') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [stats, setStats] = useState<BarStats | null>(null);

  // ══════════════════════════════════════════════════════════════
  // SHARED STATE
  // ══════════════════════════════════════════════════════════════
  const [categories, setCategories] = useState<BarCategory[]>([]);
  const [menuItems, setMenuItems] = useState<BarMenuItem[]>([]);
  const [tables, setTables] = useState<DiningTable[]>([]);
  const [tabs, setTabs] = useState<BarTab[]>([]);
  const [orders, setOrders] = useState<BarOrder[]>([]);

  // ══════════════════════════════════════════════════════════════
  // TAB 1: POS ORDERING STATE
  // ══════════════════════════════════════════════════════════════
  const [posCategoryFilter, setPosCategoryFilter] = useState<number | 'all'>('all');
  const [posSearch, setPosSearch] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedTableId, setSelectedTableId] = useState<number | ''>('');
  const [selectedTabId, setSelectedTabId] = useState<number | ''>('');
  const [customerType, setCustomerType] = useState<'walkin' | 'member'>('walkin');
  const [guestName, setGuestName] = useState('');
  const [memberId, setMemberId] = useState<number | ''>('');
  const [memberDiscountPct, setMemberDiscountPct] = useState<number>(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

  // Quick Counter Checkout Modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'cash' | 'card' | 'upi'>('upi');
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // ══════════════════════════════════════════════════════════════
  // TAB 3: TABLES & TABS STATE
  // ══════════════════════════════════════════════════════════════
  const [tableZoneFilter, setTableZoneFilter] = useState<string>('all');
  const [isOpenTabModalOpen, setIsOpenTabModalOpen] = useState(false);
  const [newTabTableId, setNewTabTableId] = useState<number | ''>('');
  const [newTabGuestName, setNewTabGuestName] = useState('');
  const [isSubmittingNewTab, setIsSubmittingNewTab] = useState(false);

  // Settle Tab Modal
  const [selectedTabForSettle, setSelectedTabForSettle] = useState<BarTab | null>(null);
  const [settleMethod, setSettleMethod] = useState<'cash' | 'card' | 'upi'>('upi');
  const [settleNotes, setSettleNotes] = useState('');
  const [isSubmittingSettle, setIsSubmittingSettle] = useState(false);

  // ══════════════════════════════════════════════════════════════
  // TAB 4: MENU 86 AVAILABILITY STATE
  // ══════════════════════════════════════════════════════════════
  const [selectedItemForEdit, setSelectedItemForEdit] = useState<BarMenuItem | null>(null);
  const [editPrice, setEditPrice] = useState<string>('');
  const [isSubmittingItemEdit, setIsSubmittingItemEdit] = useState(false);

  // ══════════════════════════════════════════════════════════════
  // DATA REFRESH FUNCTION
  // ══════════════════════════════════════════════════════════════
  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const [cats, menu, tbls, tbs, ords, st] = await Promise.all([
        barService.getCategories(),
        barService.getMenu(),
        barService.getTables(),
        barService.getTabs('all'),
        barService.getOrders(),
        barService.getStats(),
      ]);
      setCategories(cats);
      setMenuItems(menu);
      setTables(tbls);
      setTabs(tbs);
      setOrders(ords);
      setStats(st);
    } catch (err: any) {
      console.error('[BarStaffPage] error loading data:', err);
      toast.error(err?.response?.data?.message || 'Could not synchronize bar station');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto polling for kitchen display every 15 seconds
    const interval = setInterval(() => {
      barService.getOrders().then(setOrders).catch(() => {});
      barService.getStats().then(setStats).catch(() => {});
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // ══════════════════════════════════════════════════════════════
  // CART ACTIONS & CALCULATIONS
  // ══════════════════════════════════════════════════════════════
  const addToCart = (item: BarMenuItem) => {
    if (!item.is_available) {
      toast.error(`${item.name} is currently 86'd / Sold Out`);
      return;
    }
    setCart((prev) => {
      const existing = prev.find((c) => c.menu_item.id === item.id);
      if (existing) {
        return prev.map((c) =>
          c.menu_item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      }
      return [...prev, { menu_item: item, quantity: 1, special_instructions: '' }];
    });
  };

  const updateQuantity = (itemId: number, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.menu_item.id === itemId) {
            const newQty = c.quantity + delta;
            return newQty > 0 ? { ...c, quantity: newQty } : null;
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const updateInstructions = (itemId: number, text: string) => {
    setCart((prev) =>
      prev.map((c) => (c.menu_item.id === itemId ? { ...c, special_instructions: text } : c))
    );
  };

  const clearCart = () => {
    setCart([]);
    setOrderNotes('');
  };

  // Cart financial totals
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + Number(item.menu_item.price) * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return memberDiscountPct > 0 ? (subtotal * memberDiscountPct) / 100 : 0;
  }, [subtotal, memberDiscountPct]);

  const taxAmount = useMemo(() => {
    const discounted = subtotal - discountAmount;
    return (discounted * 5) / 100; // 5% GST
  }, [subtotal, discountAmount]);

  const grandTotal = useMemo(() => {
    return Math.round((subtotal - discountAmount + taxAmount) * 100) / 100;
  }, [subtotal, discountAmount, taxAmount]);

  // ══════════════════════════════════════════════════════════════
  // DISPATCH ORDER TO KITCHEN / KDS
  // ══════════════════════════════════════════════════════════════
  const handleSendToKitchen = async () => {
    if (cart.length === 0) {
      toast.error('Order ticket is empty');
      return;
    }

    setIsSubmittingOrder(true);
    try {
      const res = await barService.createOrder({
        table_id: selectedTableId ? Number(selectedTableId) : null,
        tab_id: selectedTabId ? Number(selectedTabId) : null,
        member_id: memberId ? Number(memberId) : null,
        guest_name: guestName.trim() || undefined,
        notes: orderNotes.trim() || undefined,
        items: cart.map((c) => ({
          menu_item_id: c.menu_item.id,
          quantity: c.quantity,
          special_instructions: c.special_instructions.trim() || undefined,
        })),
      });

      toast.success(res.message || 'Order dispatched to kitchen!');
      clearCart();
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to dispatch order');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // DIRECT COUNTER CHECKOUT
  // ══════════════════════════════════════════════════════════════
  const handleDirectCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      toast.error('Order ticket is empty');
      return;
    }

    setIsProcessingCheckout(true);
    try {
      const res = await barService.directCheckout({
        member_id: memberId ? Number(memberId) : null,
        guest_name: guestName.trim() || 'Walk-in Counter Guest',
        payment_method: checkoutPaymentMethod,
        notes: orderNotes.trim() || 'Counter Touch Sale',
        items: cart.map((c) => ({
          menu_item_id: c.menu_item.id,
          quantity: c.quantity,
        })),
      });

      toast.success(res.message || 'Sale settled successfully!');
      setIsCheckoutModalOpen(false);
      clearCart();
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Checkout failed');
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // KDS ORDER STATUS TRANSITION
  // ══════════════════════════════════════════════════════════════
  const handleAdvanceOrderStatus = async (
    order: BarOrder,
    nextStatus: 'preparing' | 'ready' | 'served'
  ) => {
    try {
      const res = await barService.updateOrderStatus(order.id, nextStatus);
      toast.success(res.message || `Order #${order.order_no} marked ${nextStatus}`);
      const updatedOrders = await barService.getOrders();
      setOrders(updatedOrders);
    } catch (err: any) {
      toast.error('Status update failed');
    }
  };

  const handleCancelOrder = async (order: BarOrder) => {
    const reason = window.prompt(`Reason for cancelling Order #${order.order_no}:`, 'Customer cancelled');
    if (!reason) return;
    try {
      const res = await barService.cancelOrder(order.id, reason);
      toast.success(res.message || 'Order cancelled');
      const updatedOrders = await barService.getOrders();
      setOrders(updatedOrders);
    } catch (err: any) {
      toast.error('Failed to cancel order');
    }
  };

  // ══════════════════════════════════════════════════════════════
  // TABS & TABLES ACTIONS
  // ══════════════════════════════════════════════════════════════
  const handleOpenNewTab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTabGuestName.trim() && !newTabTableId) {
      toast.error('Please provide a guest/member name or select a table');
      return;
    }

    setIsSubmittingNewTab(true);
    try {
      const res = await barService.openTab({
        table_id: newTabTableId ? Number(newTabTableId) : null,
        guest_name: newTabGuestName.trim() || undefined,
      });
      toast.success(res.message || 'Tab opened successfully');
      setIsOpenTabModalOpen(false);
      setNewTabTableId('');
      setNewTabGuestName('');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to open tab');
    } finally {
      setIsSubmittingNewTab(false);
    }
  };

  const handleSettleTab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTabForSettle) return;

    setIsSubmittingSettle(true);
    try {
      const res = await barService.settleTab(selectedTabForSettle.id, {
        method: settleMethod,
        notes: settleNotes.trim() || undefined,
      });
      toast.success(res.message || 'Tab settled successfully');
      setSelectedTabForSettle(null);
      setSettleNotes('');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to settle tab');
    } finally {
      setIsSubmittingSettle(false);
    }
  };

  const handleUpdateTableStatus = async (
    tableId: number,
    status: 'free' | 'occupied' | 'cleaning' | 'reserved'
  ) => {
    try {
      const res = await barService.updateTableStatus(tableId, status);
      toast.success(res.message || 'Table status updated');
      const updatedTables = await barService.getTables();
      setTables(updatedTables);
    } catch (err: any) {
      toast.error('Failed to update table');
    }
  };

  // ══════════════════════════════════════════════════════════════
  // MENU 86 AVAILABILITY TOGGLE
  // ══════════════════════════════════════════════════════════════
  const handleToggleItemAvailability = async (item: BarMenuItem) => {
    const nextVal = item.is_available ? 0 : 1;
    try {
      const res = await barService.updateMenuAvailability(item.id, { is_available: nextVal });
      toast.success(
        nextVal ? `${item.name} is now Available / In Stock` : `${item.name} 86'd (Sold Out)`
      );
      setMenuItems((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, is_available: nextVal } : m))
      );
    } catch (err: any) {
      toast.error('Failed to toggle item availability');
    }
  };

  const handleSaveItemPrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForEdit) return;
    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid price');
      return;
    }

    setIsSubmittingItemEdit(true);
    try {
      const res = await barService.updateMenuAvailability(selectedItemForEdit.id, { price: priceNum });
      toast.success(res.message || 'Menu price updated');
      setSelectedItemForEdit(null);
      const updatedMenu = await barService.getMenu();
      setMenuItems(updatedMenu);
    } catch (err: any) {
      toast.error('Failed to update price');
    } finally {
      setIsSubmittingItemEdit(false);
    }
  };

  // Filtered menu items for POS
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchesCategory =
        posCategoryFilter === 'all' || item.category_id === posCategoryFilter;
      const matchesSearch =
        item.name.toLowerCase().includes(posSearch.toLowerCase()) ||
        item.description?.toLowerCase().includes(posSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [menuItems, posCategoryFilter, posSearch]);

  return (
    <PageLayout>
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* ══════════════════════════════════════════════════════════════
            HOSPITALITY HERO HEADER
            ══════════════════════════════════════════════════════════════ */}
        <div className="relative rounded-3xl p-6 sm:p-8 mb-8 overflow-hidden border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0A0A0D]/80 backdrop-blur-2xl shadow-xl">
          {/* Subtle Ambient Gold Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#B89047]/15 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl p-[2px] bg-gradient-to-br from-[#EAD29A] via-[#B89047] to-[#7D5A1E] flex-shrink-0 shadow-lg shadow-[#B89047]/20">
                <div className="w-full h-full rounded-2xl bg-[#121214] flex items-center justify-center">
                  <Coffee className="w-7 h-7 text-[#EAD29A]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                    Hospitality & Bar Station
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Staff: <strong>{user?.name || 'Imran Shaikh'}</strong>
                  </span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1D1D1F] dark:text-white mt-1 tracking-tight">
                  Champions Cafe & Lounge POS
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Point-of-sale touch tickets, kitchen display queue, dining table floor plan & tabs.
                </p>
              </div>
            </div>

            {/* Quick Metrics Pills */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/5 text-center min-w-[90px]">
                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold block">Today's Sales</span>
                <span className="text-xs font-bold text-emerald-500 font-display">₹{Number(stats?.total_sales || 0).toLocaleString()}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/5 text-center min-w-[80px]">
                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold block">Orders</span>
                <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">{stats?.total_orders || 0}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/5 text-center min-w-[80px]">
                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold block">Open Tabs</span>
                <span className="text-xs font-bold text-amber-500">{stats?.active_tabs || 0}</span>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-black/5 dark:bg-white/[0.04] border border-black/5 dark:border-white/5 text-center min-w-[80px]">
                <span className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold block">In Kitchen</span>
                <span className="text-xs font-bold text-purple-400">{stats?.pending_orders || 0}</span>
              </div>

              <button
                type="button"
                onClick={loadData}
                disabled={isRefreshing}
                className="w-10 h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] flex items-center justify-center text-[#B89047] hover:border-[#B89047]/50 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                title="Refresh Live Station"
              >
                <RotateCw size={15} className={cn(isRefreshing && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              SUB-NAV TABS
              ══════════════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-1 scrollbar-none border-t border-black/5 dark:border-white/10 pt-5">
            {[
              { id: 'pos',    label: 'Touch POS Station',   icon: UtensilsCrossed },
              { id: 'kds',    label: 'Kitchen KDS Queue',    icon: Flame, badge: stats?.pending_orders },
              { id: 'tables', label: 'Tables & Tabs',        icon: LayoutGrid, badge: stats?.active_tabs },
              { id: 'menu',   label: 'Menu 86 Board',        icon: SlidersHorizontal },
            ].map(({ id, label, icon: Icon, badge }) => {
              const isActive = activeTab === id;
              return (
                <button
                  key={id}
                  onClick={() => handleTabChange(id as any)}
                  className={cn(
                    'flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer select-none',
                    isActive
                      ? 'bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] text-white dark:text-black shadow-md border border-[#B89047]/40'
                      : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-black/10 dark:hover:bg-white/10 border border-transparent'
                  )}
                >
                  <Icon size={14} className={isActive ? 'text-[#EAD29A] dark:text-black' : 'text-gray-400'} />
                  <span>{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-extrabold',
                      isActive ? 'bg-black text-[#EAD29A] dark:bg-black dark:text-white' : 'bg-[#B89047] text-black'
                    )}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: TOUCH POS & ORDERING STATION
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'pos' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left 7 Columns: Menu Catalog & Categories */}
            <div className="lg:col-span-7 space-y-6">
              {/* Category Pills & Search */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    type="button"
                    onClick={() => setPosCategoryFilter('all')}
                    className={cn(
                      'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                      posCategoryFilter === 'all'
                        ? 'bg-[#B89047] text-white'
                        : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-black/10'
                    )}
                  >
                    All Items
                  </button>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setPosCategoryFilter(cat.id)}
                      className={cn(
                        'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer',
                        posCategoryFilter === cat.id
                          ? 'bg-[#B89047] text-white'
                          : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-black/10'
                      )}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="relative flex-shrink-0">
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={posSearch}
                    onChange={(e) => setPosSearch(e.target.value)}
                    className="w-full sm:w-48 px-3 py-1.5 pl-8 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs text-[#1D1D1F] dark:text-white outline-none"
                  />
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Menu Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {filteredMenuItems.map((item) => {
                  const inCartCount = cart.find((c) => c.menu_item.id === item.id)?.quantity || 0;
                  return (
                    <div
                      key={item.id}
                      onClick={() => addToCart(item)}
                      className={cn(
                        'p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between group select-none',
                        item.is_available
                          ? 'bg-white/80 dark:bg-[#0E0E12] border-black/10 dark:border-white/10 hover:border-[#B89047]/60 hover:shadow-md'
                          : 'bg-black/[0.02] dark:bg-white/[0.02] border-dashed border-gray-400/30 opacity-60'
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-[#B89047]">
                            {item.category_name}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] font-bold px-2 py-0.5 rounded-full capitalize',
                              item.is_available
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-red-500/15 text-red-500'
                            )}
                          >
                            {item.is_available ? item.station : 'Sold Out'}
                          </span>
                        </div>
                        <h4 className="font-display text-sm font-bold text-[#1D1D1F] dark:text-white group-hover:text-[#B89047] transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {item.description}
                        </p>
                      </div>

                      <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between">
                        <span className="font-display text-base font-bold text-[#1D1D1F] dark:text-white">
                          ₹{Number(item.price).toLocaleString()}
                        </span>

                        <div className="flex items-center gap-2">
                          {inCartCount > 0 && (
                            <span className="w-6 h-6 rounded-full bg-[#B89047] text-white flex items-center justify-center text-xs font-bold">
                              {inCartCount}
                            </span>
                          )}
                          <button
                            type="button"
                            disabled={!item.is_available}
                            className="w-8 h-8 rounded-xl bg-[#B89047]/10 text-[#B89047] hover:bg-[#B89047] hover:text-white flex items-center justify-center transition-colors disabled:opacity-40"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right 5 Columns: Interactive Ticket / Live Cart */}
            <div className="lg:col-span-5 rounded-3xl p-6 border border-black/10 dark:border-white/10 bg-white/90 dark:bg-[#0E0E12] backdrop-blur-2xl shadow-xl space-y-5 sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <Receipt size={18} className="text-[#B89047]" />
                  <h3 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white">
                    Live Order Ticket
                  </h3>
                </div>
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-[11px] text-red-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 size={12} />
                    <span>Clear</span>
                  </button>
                )}
              </div>

              {/* Dining Destination Selector (Table vs Takeaway) */}
              <div className="space-y-1.5 text-xs">
                <label className="block font-semibold text-gray-700 dark:text-gray-300">
                  Service Destination
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    value={selectedTableId}
                    onChange={(e) => {
                      setSelectedTableId(e.target.value ? Number(e.target.value) : '');
                      // Auto pick open tab for this table if any
                      const found = tabs.find((t) => t.table_id === Number(e.target.value) && t.status === 'open');
                      if (found) setSelectedTabId(found.id);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                  >
                    <option value="">Counter / Takeaway</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} ({t.zone}) — {t.status}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedTabId}
                    onChange={(e) => setSelectedTabId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                  >
                    <option value="">No Tab (Immediate)</option>
                    {tabs
                      .filter((t) => t.status === 'open')
                      .map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.tab_no} ({t.guest_name || t.member_name || 'Guest'})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Guest / Member Details */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-700 dark:text-gray-300">Guest / Member</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerType('walkin');
                        setMemberId('');
                        setMemberDiscountPct(0);
                      }}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-semibold transition-colors',
                        customerType === 'walkin' ? 'bg-[#B89047] text-white' : 'text-gray-400'
                      )}
                    >
                      Walk-in
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomerType('member')}
                      className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-semibold transition-colors',
                        customerType === 'member' ? 'bg-[#B89047] text-white' : 'text-gray-400'
                      )}
                    >
                      Club Member
                    </button>
                  </div>
                </div>

                {customerType === 'walkin' ? (
                  <input
                    type="text"
                    placeholder="Guest Name (e.g. Vikram)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                  />
                ) : (
                  <div className="space-y-1">
                    <select
                      value={memberId}
                      onChange={(e) => {
                        const val = e.target.value ? Number(e.target.value) : '';
                        setMemberId(val);
                        // Gold members get 10% discount, Silver gets 5%
                        if (val === 1 || val === 4) setMemberDiscountPct(10);
                        else if (val) setMemberDiscountPct(5);
                        else setMemberDiscountPct(0);
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                    >
                      <option value="">Select Member</option>
                      <option value="1">Ravi Shankar (Gold VIP — 10% Off)</option>
                      <option value="2">Rahul Bose (Silver — 5% Off)</option>
                      <option value="3">Ananya Singh (Silver — 5% Off)</option>
                      <option value="4">Vihaan Reddy (Gold VIP — 10% Off)</option>
                      <option value="5">Ishita Menon (Silver — 5% Off)</option>
                    </select>
                    {memberDiscountPct > 0 && (
                      <span className="text-[10px] text-emerald-500 font-semibold block">
                        ✓ VIP Privilege: {memberDiscountPct}% Member Discount Applied
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Cart Items List */}
              <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                {cart.length === 0 ? (
                  <div className="py-8 text-center text-gray-400 text-xs italic">
                    Tap any menu item on the left to add to ticket.
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.menu_item.id}
                      className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-semibold text-xs text-[#1D1D1F] dark:text-white">
                            {item.menu_item.name}
                          </h5>
                          <span className="text-[10px] text-gray-400">
                            ₹{Number(item.menu_item.price).toLocaleString()} each
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.menu_item.id, -1)}
                            className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 flex items-center justify-center text-xs"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="font-bold text-xs w-4 text-center">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.menu_item.id, 1)}
                            className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 flex items-center justify-center text-xs"
                          >
                            <Plus size={12} />
                          </button>
                          <span className="font-bold text-xs text-[#1D1D1F] dark:text-white ml-2">
                            ₹{(Number(item.menu_item.price) * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      {/* Special instructions */}
                      <input
                        type="text"
                        placeholder="Special instructions (e.g. less ice, oat milk)..."
                        value={item.special_instructions}
                        onChange={(e) => updateInstructions(item.menu_item.id, e.target.value)}
                        className="w-full px-2.5 py-1 text-[11px] rounded-lg border border-black/5 dark:border-white/5 bg-white dark:bg-white/[0.02] text-gray-700 dark:text-gray-300 outline-none"
                      />
                    </div>
                  ))
                )}
              </div>

              {/* Order Notes */}
              <div>
                <input
                  type="text"
                  placeholder="Ticket notes (e.g. serve immediately with cutlery)..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                />
              </div>

              {/* Financial Totals */}
              <div className="pt-3 border-t border-black/10 dark:border-white/10 space-y-1.5 text-xs">
                <div className="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-500 font-semibold">
                    <span>Member Discount ({memberDiscountPct}%)</span>
                    <span>-₹{discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-500">
                  <span>GST (5%)</span>
                  <span>₹{taxAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-base font-bold text-[#1D1D1F] dark:text-white pt-2 border-t border-black/5 dark:border-white/5 font-display">
                  <span>Total Amount</span>
                  <span>₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSendToKitchen}
                  disabled={cart.length === 0 || isSubmittingOrder}
                  className="py-3 px-3 rounded-xl font-semibold text-xs text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] shadow-md hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Send size={13} />
                  <span>Send to KDS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(true)}
                  disabled={cart.length === 0}
                  className="py-3 px-3 rounded-xl font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700 shadow-md disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CreditCard size={13} />
                  <span>Direct Pay</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: KITCHEN DISPLAY SYSTEM (KDS) & ORDER QUEUE
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'kds' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Flame size={20} className="text-amber-500" />
                  <span>Kitchen & Bar Preparation Queue</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Real-time ticket pipeline. Monitor preparation times and dispatch ready orders to runners.
                </p>
              </div>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { status: 'placed',    label: 'Incoming Tickets', color: 'border-blue-500/30 bg-blue-500/5' },
                { status: 'preparing', label: 'In Preparation',   color: 'border-amber-500/30 bg-amber-500/5' },
                { status: 'ready',     label: 'Ready for Service', color: 'border-emerald-500/30 bg-emerald-500/5' },
                { status: 'served',    label: 'Delivered / Served', color: 'border-gray-500/30 bg-black/[0.02]' },
              ].map(({ status, label, color }) => {
                const columnOrders = orders.filter((o) => o.status === status);
                return (
                  <div key={status} className={cn('rounded-2xl p-4 border flex flex-col', color)}>
                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-black/5 dark:border-white/5">
                      <span className="text-xs font-bold font-display uppercase tracking-wider text-[#1D1D1F] dark:text-white">
                        {label}
                      </span>
                      <span className="w-5 h-5 rounded-full bg-[#B89047] text-white flex items-center justify-center text-[10px] font-bold">
                        {columnOrders.length}
                      </span>
                    </div>

                    <div className="space-y-3 flex-1 overflow-y-auto max-h-[70vh] pr-1">
                      {columnOrders.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-xs italic">
                          No tickets in {status}
                        </div>
                      ) : (
                        columnOrders.map((ord) => {
                          const elapsedMins = Math.floor(
                            (Date.now() - new Date(ord.placed_at).getTime()) / 60000
                          );
                          return (
                            <div
                              key={ord.id}
                              className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-sm space-y-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-bold text-[#B89047]">
                                  {ord.order_no}
                                </span>
                                <span
                                  className={cn(
                                    'text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1',
                                    elapsedMins > 10
                                      ? 'bg-red-500/15 text-red-500'
                                      : elapsedMins > 5
                                      ? 'bg-amber-500/15 text-amber-500'
                                      : 'bg-emerald-500/15 text-emerald-500'
                                  )}
                                >
                                  <Clock size={10} />
                                  <span>{elapsedMins}m ago</span>
                                </span>
                              </div>

                              <div className="text-xs font-medium text-gray-700 dark:text-gray-200">
                                Destination: <strong>{ord.table_number || 'Counter Takeaway'}</strong>
                                {ord.guest_name || ord.member_name ? ` • ${ord.guest_name || ord.member_name}` : ''}
                              </div>

                              {/* Items List */}
                              <div className="space-y-1.5 pt-2 border-t border-black/5 dark:border-white/5">
                                {ord.items?.map((it, idx) => (
                                  <div key={idx} className="text-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-[#1D1D1F] dark:text-white">
                                        {it.quantity}x {it.item_name}
                                      </span>
                                      <span className="text-[10px] uppercase text-gray-400">
                                        {it.station}
                                      </span>
                                    </div>
                                    {it.special_instructions && (
                                      <span className="text-[10px] text-amber-500 italic block">
                                        Note: {it.special_instructions}
                                      </span>
                                    )}
                                  </div>
                                ))}
                              </div>

                              {ord.notes && (
                                <p className="text-[11px] text-gray-400 bg-black/[0.02] dark:bg-white/[0.02] p-1.5 rounded">
                                  {ord.notes}
                                </p>
                              )}

                              {/* Action Transitions */}
                              <div className="pt-2 border-t border-black/5 dark:border-white/5 flex items-center gap-1.5 justify-end">
                                {status === 'placed' && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceOrderStatus(ord, 'preparing')}
                                    className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-amber-500 hover:bg-amber-600 transition-colors cursor-pointer"
                                  >
                                    Start Prep
                                  </button>
                                )}
                                {status === 'preparing' && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceOrderStatus(ord, 'ready')}
                                    className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-emerald-500 hover:bg-emerald-600 transition-colors cursor-pointer"
                                  >
                                    Mark Ready
                                  </button>
                                )}
                                {status === 'ready' && (
                                  <button
                                    type="button"
                                    onClick={() => handleAdvanceOrderStatus(ord, 'served')}
                                    className="px-3 py-1 rounded-lg text-xs font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors cursor-pointer"
                                  >
                                    Mark Served
                                  </button>
                                )}
                                {status !== 'served' && (
                                  <button
                                    type="button"
                                    onClick={() => handleCancelOrder(ord)}
                                    className="px-2 py-1 rounded-lg text-xs text-red-500 hover:bg-red-500/10 transition-colors cursor-pointer"
                                    title="Cancel Order"
                                  >
                                    <X size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 3: DINING TABLES & TABS MANAGEMENT
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'tables' && (
          <div className="space-y-8">
            {/* Section A: Dining Table Floor Plan */}
            <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Dining Tables Floor Plan & Seating Status
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Indoor lounge, terrace patio, and poolside cocktail seating.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  {['all', 'indoor', 'terrace', 'lounge'].map((zone) => (
                    <button
                      key={zone}
                      type="button"
                      onClick={() => setTableZoneFilter(zone)}
                      className={cn(
                        'px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-colors cursor-pointer',
                        tableZoneFilter === zone
                          ? 'bg-[#B89047] text-white'
                          : 'bg-black/5 dark:bg-white/5 text-gray-600 dark:text-gray-300'
                      )}
                    >
                      {zone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {tables
                  .filter((t) => tableZoneFilter === 'all' || t.zone === tableZoneFilter)
                  .map((tbl) => (
                    <div
                      key={tbl.id}
                      className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-mono text-xs font-bold text-[#B89047]">
                            {tbl.table_number}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded capitalize',
                              tbl.status === 'free'
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : tbl.status === 'occupied'
                                ? 'bg-amber-500/15 text-amber-500'
                                : 'bg-purple-500/15 text-purple-400'
                            )}
                          >
                            {tbl.status}
                          </span>
                        </div>
                        <h4 className="font-display text-sm font-bold text-[#1D1D1F] dark:text-white capitalize">
                          {tbl.zone} Zone • {tbl.seats} Seats
                        </h4>
                        {tbl.tab_no && (
                          <div className="mt-2 text-[11px] text-amber-500 font-semibold">
                            Active Tab: {tbl.tab_no} ({tbl.guest_name || tbl.member_name || 'Guest'})
                          </div>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 flex items-center justify-between gap-1 text-[11px]">
                        <button
                          type="button"
                          onClick={() => handleUpdateTableStatus(tbl.id, 'free')}
                          className="px-2 py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-emerald-500/20 hover:text-emerald-500 transition-colors"
                        >
                          Free
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateTableStatus(tbl.id, 'occupied')}
                          className="px-2 py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-amber-500/20 hover:text-amber-500 transition-colors"
                        >
                          Occupied
                        </button>
                        <button
                          type="button"
                          onClick={() => handleUpdateTableStatus(tbl.id, 'cleaning')}
                          className="px-2 py-1 rounded bg-black/5 dark:bg-white/5 hover:bg-purple-500/20 hover:text-purple-400 transition-colors"
                        >
                          Clean
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Section B: Bar Tabs Ledger */}
            <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Open Bar Tabs & Member Hospitality Ledger
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Track open bar tabs, add orders throughout the evening, and settle upon checkout.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpenTabModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] hover:opacity-90 shadow-md border border-[#B89047]/30 flex items-center gap-2 cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Open New Tab</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Tab No</th>
                      <th className="py-3 px-3">Table</th>
                      <th className="py-3 px-3">Customer / Member</th>
                      <th className="py-3 px-3">Orders</th>
                      <th className="py-3 px-3">Running Total</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Opened At</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {tabs.map((tab) => (
                      <tr key={tab.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-3 px-3 font-mono font-bold text-[#1D1D1F] dark:text-white">
                          {tab.tab_no}
                        </td>
                        <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                          {tab.table_number || 'Counter'}
                        </td>
                        <td className="py-3 px-3 font-medium text-gray-800 dark:text-gray-200">
                          {tab.member_name || tab.guest_name || 'Guest'}
                        </td>
                        <td className="py-3 px-3 text-gray-500">{tab.order_count} orders</td>
                        <td className="py-3 px-3 font-bold text-sm text-[#1D1D1F] dark:text-white font-display">
                          ₹{Number(tab.tab_total).toLocaleString()}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize',
                              tab.status === 'open'
                                ? 'bg-amber-500/15 text-amber-500'
                                : 'bg-emerald-500/15 text-emerald-500'
                            )}
                          >
                            {tab.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-gray-400">
                          {new Date(tab.opened_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="py-3 px-3 text-right">
                          {tab.status === 'open' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTabForSettle(tab);
                                setSettleNotes('');
                              }}
                              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-colors cursor-pointer"
                            >
                              Settle Tab
                            </button>
                          ) : (
                            <span className="text-[10px] text-gray-400 italic">Settled</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 4: MENU 86 BOARD & AVAILABILITY
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'menu' && (
          <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md space-y-6">
            <div>
              <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                Live Menu Availability & "86 Board"
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Instantly mark items as Sold Out / 86'd when ingredients run out. Prevents front desk & POS mistakes.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-black/10 dark:border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                    <th className="py-3 px-3">Item Name</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Station</th>
                    <th className="py-3 px-3">Price</th>
                    <th className="py-3 px-3">Kitchen Status</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                  {menuItems.map((item) => (
                    <tr key={item.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                      <td className="py-3 px-3 font-semibold text-[#1D1D1F] dark:text-white">
                        {item.name}
                        <span className="text-[10px] text-gray-400 block font-normal line-clamp-1">
                          {item.description}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{item.category_name}</td>
                      <td className="py-3 px-3 capitalize text-gray-500">{item.station}</td>
                      <td className="py-3 px-3 font-bold text-[#1D1D1F] dark:text-white font-display">
                        ₹{Number(item.price).toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize',
                            item.is_available
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-red-500/15 text-red-500'
                          )}
                        >
                          {item.is_available ? 'Serving / In Stock' : '86\'d / Sold Out'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleItemAvailability(item)}
                            className={cn(
                              'px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                              item.is_available
                                ? 'text-red-500 bg-red-500/10 hover:bg-red-500/20'
                                : 'text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20'
                            )}
                          >
                            {item.is_available ? '86 Item' : 'Restock Item'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedItemForEdit(item);
                              setEditPrice(item.price);
                            }}
                            className="px-2.5 py-1 rounded-lg text-xs text-gray-500 hover:text-black dark:hover:text-white bg-black/5 dark:bg-white/5 cursor-pointer"
                          >
                            Edit Price
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODAL 1: DIRECT COUNTER CHECKOUT
            ══════════════════════════════════════════════════════════════ */}
        {isCheckoutModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Counter Sale Payment
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Total Due: <strong>₹{grandTotal.toLocaleString()}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCheckoutModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleDirectCheckout} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Select Payment Method *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['upi', 'card', 'cash'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setCheckoutPaymentMethod(m as any)}
                        className={cn(
                          'py-2.5 rounded-xl font-bold uppercase text-xs border transition-colors cursor-pointer',
                          checkoutPaymentMethod === m
                            ? 'bg-[#B89047] text-white border-[#B89047]'
                            : 'border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-300'
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] space-y-1 text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Items Count:</span>
                    <span className="font-bold text-[#1D1D1F] dark:text-white">{cart.length} items</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Grand Total:</span>
                    <span className="font-bold text-base text-emerald-500 font-display">
                      ₹{grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsCheckoutModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingCheckout}
                    className="px-5 py-2 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {isProcessingCheckout ? 'Settling...' : 'Confirm Payment & Issue Receipt'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODAL 2: OPEN NEW TAB
            ══════════════════════════════════════════════════════════════ */}
        {isOpenTabModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Open New Bar Tab
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Start a running tab for a dining table or patron
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpenTabModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleOpenNewTab} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Assign Dining Table (Optional)
                  </label>
                  <select
                    value={newTabTableId}
                    onChange={(e) => setNewTabTableId(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                  >
                    <option value="">No Specific Table</option>
                    {tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.table_number} ({t.zone}) — {t.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Guest / Member Name *
                  </label>
                  <input
                    type="text"
                    value={newTabGuestName}
                    onChange={(e) => setNewTabGuestName(e.target.value)}
                    placeholder="e.g. Rahul Patel or Table 4 Group"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                    required
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsOpenTabModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingNewTab}
                    className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingNewTab ? 'Opening...' : 'Open Tab'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODAL 3: SETTLE TAB
            ══════════════════════════════════════════════════════════════ */}
        {selectedTabForSettle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Settle Tab #{selectedTabForSettle.tab_no}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedTabForSettle.guest_name || selectedTabForSettle.member_name || 'Guest'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedTabForSettle(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSettleTab} className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] space-y-1 text-gray-600 dark:text-gray-300">
                  <div className="flex justify-between">
                    <span>Total Tab Orders:</span>
                    <span className="font-bold text-[#1D1D1F] dark:text-white">
                      {selectedTabForSettle.order_count}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Balance Due:</span>
                    <span className="font-bold text-base text-emerald-500 font-display">
                      ₹{Number(selectedTabForSettle.tab_total).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Settlement Method *
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['upi', 'card', 'cash'].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setSettleMethod(m as any)}
                        className={cn(
                          'py-2.5 rounded-xl font-bold uppercase text-xs border transition-colors cursor-pointer',
                          settleMethod === m
                            ? 'bg-[#B89047] text-white border-[#B89047]'
                            : 'border-black/10 dark:border-white/10 text-gray-600 dark:text-gray-300'
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Settlement Notes
                  </label>
                  <input
                    type="text"
                    value={settleNotes}
                    onChange={(e) => setSettleNotes(e.target.value)}
                    placeholder="e.g. Paid in full via UPI by table host"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedTabForSettle(null)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSettle}
                    className="px-5 py-2 rounded-xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingSettle ? 'Settling...' : 'Confirm Settlement & Close Tab'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODAL 4: EDIT MENU ITEM PRICE
            ══════════════════════════════════════════════════════════════ */}
        {selectedItemForEdit && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Adjust Menu Item Price
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedItemForEdit.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedItemForEdit(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveItemPrice} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none font-bold text-sm"
                    required
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedItemForEdit(null)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingItemEdit}
                    className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingItemEdit ? 'Saving...' : 'Update Price'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
};

export default BarStaffPage;
