import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  ShoppingBag,
  Barcode,
  Search,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  PackageCheck,
  CreditCard,
  Banknote,
  QrCode,
  Layers,
  ArrowRight,
  Printer,
  Sparkles,
  RefreshCw,
  Clock,
  User,
  ShieldCheck,
  ChevronRight,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { shopStaffService } from '../services/shopStaffService';
import {
  ShopProduct,
  ShopProductVariant,
  CartItem,
  PendingPickupOrder,
  ShopStats
} from '../types/shopStaff.types';
import { cn } from '../utils/cn';

export const ShopStaffPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isNight = theme === 'night';
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'pos';

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // State
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [catalog, setCatalog] = useState<ShopProduct[]>([]);
  const [flatVariants, setFlatVariants] = useState<ShopProductVariant[]>([]);
  const [pendingOrders, setPendingOrders] = useState<PendingPickupOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSkuPickerOpen, setIsSkuPickerOpen] = useState(false);
  const [skuPickerSearch, setSkuPickerSearch] = useState('');

  // POS State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [skuInput, setSkuInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Card' | 'UPI'>('UPI');
  const [discountPct, setDiscountPct] = useState<number>(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);

  // Returns State
  const [returnOrderId, setReturnOrderId] = useState('');
  const [returnOrderData, setReturnOrderData] = useState<PendingPickupOrder | null>(null);
  const [selectedReturnItems, setSelectedReturnItems] = useState<number[]>([]);
  const [returnReason, setReturnReason] = useState('Size exchange / Customer preference');
  const [isProcessingReturn, setIsProcessingReturn] = useState(false);

  // Load initial data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, catalogData, pickupsData] = await Promise.all([
        shopStaffService.getStats().catch(() => null),
        shopStaffService.getCatalog(),
        shopStaffService.getPendingPickups().catch(() => []),
      ]);
      if (statsData) setStats(statsData);
      setCatalog(catalogData.catalog);
      setFlatVariants(catalogData.flatVariants);
      setPendingOrders(pickupsData);
    } catch (err: any) {
      console.error('Failed to load shop data', err);
      toast.error('Failed to load catalog and orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    catalog.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [catalog]);

  // Filtered products for POS
  const filteredProducts = useMemo(() => {
    return catalog.filter((product) => {
      const matchesCat = selectedCategory === 'All' || product.category === selectedCategory;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        product.product_name.toLowerCase().includes(q) ||
        (product.description && product.description.toLowerCase().includes(q)) ||
        product.variants.some(
          (v) =>
            v.sku.toLowerCase().includes(q) ||
            (v.barcode && v.barcode.toLowerCase().includes(q)) ||
            (v.size && v.size.toLowerCase().includes(q)) ||
            (v.color && v.color.toLowerCase().includes(q))
        );
      return matchesCat && matchesSearch;
    });
  }, [catalog, selectedCategory, searchQuery]);

  // Handle SKU Scanner with validation, smart fallback matching, and quick chip triggers
  const triggerScan = async (rawQuery: string) => {
    const query = rawQuery.trim();
    if (!query) {
      setIsSkuPickerOpen(true);
      return;
    }

    const lowerQ = query.toLowerCase();

    // 1. Check exact match in flat variants (SKU or barcode)
    let match = flatVariants.find(
      (v) =>
        v.sku.toLowerCase() === lowerQ ||
        (v.barcode && v.barcode.toLowerCase() === lowerQ)
    );

    // 2. If no exact match, check partial / substring match
    if (!match) {
      match = flatVariants.find(
        (v) =>
          v.sku.toLowerCase().includes(lowerQ) ||
          (v.barcode && v.barcode.toLowerCase().includes(lowerQ)) ||
          (v.product_name && v.product_name.toLowerCase().includes(lowerQ))
      );
    }

    if (match) {
      addToCart(match);
      setSkuInput('');
      toast.success(`Scanned: ${match.product_name || match.sku}`);
      return;
    }

    // 3. Try backend lookup
    try {
      const found = await shopStaffService.getVariantBySku(query);
      if (found) {
        addToCart(found);
        setSkuInput('');
        toast.success(`Scanned: ${found.product_name || found.sku}`);
        return;
      }
    } catch {
      // Backend lookup returned 404
    }

    toast.error(`No item found for barcode/SKU: "${query}". Select an available item from the picker below.`);
    setIsSkuPickerOpen(true);
  };

  const handleSkuScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skuInput.trim()) {
      setIsSkuPickerOpen(true);
      return;
    }
    triggerScan(skuInput);
  };

  // Add variant to cart
  const addToCart = (variant: ShopProductVariant) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.variant_id === variant.variant_id);
      if (existing) {
        if (existing.quantity >= variant.stock_quantity) {
          toast.error(`Only ${variant.stock_quantity} available in stock`);
          return prev;
        }
        return prev.map((item) =>
          item.variant_id === variant.variant_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        if (variant.stock_quantity <= 0) {
          toast.error('Item is out of stock');
          return prev;
        }
        return [
          ...prev,
          {
            variant_id: variant.variant_id,
            product_name: variant.product_name || 'Pro Gear',
            sku: variant.sku,
            size: variant.size,
            color: variant.color,
            price: Number(variant.price),
            quantity: 1,
            stock_on_hand: variant.stock_quantity,
          },
        ];
      }
    });
  };

  // Update item quantity in cart
  const updateCartQty = (variant_id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.variant_id === variant_id) {
            const newQty = item.quantity + delta;
            if (newQty > item.stock_on_hand) {
              toast.error(`Max stock available: ${item.stock_on_hand}`);
              return item;
            }
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeCartItem = (variant_id: number) => {
    setCart((prev) => prev.filter((item) => item.variant_id !== variant_id));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountPct(0);
  };

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Number(((subtotal * discountPct) / 100).toFixed(2));
  }, [subtotal, discountPct]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - discountAmount);
  }, [subtotal, discountAmount]);

  // Complete In-Store POS Sale
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    setIsCheckingOut(true);
    try {
      const payload = {
        items: cart.map((i) => ({ variant_id: i.variant_id, quantity: i.quantity })),
        payment_method: paymentMethod,
        discount_pct: discountPct,
      };

      const result = await shopStaffService.processInStoreSale(payload);
      setLastReceipt({
        ...result,
        items: [...cart],
        date: new Date().toLocaleString(),
        staffName: user?.name || 'Neha Kulkarni',
      });
      clearCart();
      toast.success(`Sale completed! Receipt #${result.receiptNo}`);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error processing sale');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Fulfill Click & Collect Online Order
  const handleFulfillOrder = async (orderId: number) => {
    try {
      const res = await shopStaffService.fulfillOrder(orderId);
      toast.success(res.message || 'Order fulfilled!');
      setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to fulfill order');
    }
  };

  // Lookup Order for Return
  const handleLookupOrderForReturn = () => {
    const q = returnOrderId.trim();
    if (!q) {
      toast.error('Enter an order number or ID');
      return;
    }

    const found = pendingOrders.find(
      (o) => String(o.id) === q || o.order_no.toLowerCase() === q.toLowerCase()
    );

    if (found) {
      setReturnOrderData(found);
      setSelectedReturnItems(found.items?.map((i) => i.id) || []);
      toast.success(`Found Order #${found.order_no}`);
    } else {
      toast.error(`Order '${q}' not found in active records`);
    }
  };

  // Process Return & Restock
  const handleProcessReturn = async () => {
    if (!returnOrderData) return;
    if (selectedReturnItems.length === 0) {
      toast.error('Select at least one item to return');
      return;
    }

    setIsProcessingReturn(true);
    try {
      const res = await shopStaffService.processReturn(returnOrderData.id, {
        item_ids: selectedReturnItems,
        reason: returnReason,
      });

      toast.success(`Refund of ₹${res.refund_amount.toLocaleString()} processed! Stock replenished.`);
      setReturnOrderData(null);
      setReturnOrderId('');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to process return');
    } finally {
      setIsProcessingReturn(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F7F4] dark:bg-[#0A0A0D] text-[#1D1D1F] dark:text-[#FAF8F5] pt-24 pb-16 px-3 sm:px-6 lg:px-8 font-sans selection:bg-[#B89047]/30 transition-colors">
      {/* ── Top Header / Station Badge ────────────────────────────── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-gradient-to-r dark:from-[#14141A] dark:via-[#1A1A24] dark:to-[#121216] border border-black/10 dark:border-white/10 shadow-xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#B89047]/10 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EAD29A] via-[#B89047] to-[#7D5A1E] p-[2px] shadow-lg shadow-[#B89047]/20 flex-shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#121214] flex items-center justify-center">
                <ShoppingBag className="w-7 h-7 text-[#EAD29A]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#B89047]/20 text-[#B89047] dark:text-[#EAD29A] border border-[#B89047]/30">
                  Shop Station
                </span>
                <span className="text-xs text-gray-500 dark:text-white/50 flex items-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-500" /> Authorized Staff
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[#1D1D1F] dark:text-white mt-1">
                The Champions Pro Shop Station
              </h1>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-white/60">
                Staff Operator: <strong className="text-[#1D1D1F] dark:text-white">{user?.name || 'Neha Kulkarni'}</strong> • Barcode POS & Click & Collect Hub
              </p>
            </div>
          </div>

          {/* Quick Refresh Button */}
          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-white/80 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw size={14} className={cn(isLoading && 'animate-spin')} />
              <span>Refresh Station</span>
            </button>
          </div>
        </div>

        {/* ── KPI Metric Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider block">
              Today's POS Sales
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-[#1D1D1F] dark:text-white">
                {stats?.todayOrders ?? 0}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">Transactions</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider block">
              Today's Shop Revenue
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-[#B89047] dark:text-[#EAD29A]">
                ₹{(stats?.todayRevenue ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider block">
              Pending Click & Collect
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-amber-600 dark:text-amber-400">
                {pendingOrders.length}
              </span>
              <span className="text-xs text-gray-400">Ready for pickup</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 shadow-sm">
            <span className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider block">
              Catalog Variants
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-[#1D1D1F] dark:text-white">
                {flatVariants.length}
              </span>
              <span className="text-xs text-gray-400">Active SKUs</span>
            </div>
          </div>
        </div>

        {/* ── Sub Navigation Tabs ──────────────────────────────────── */}
        <div className="flex items-center gap-2 mt-6 p-1.5 rounded-2xl bg-white dark:bg-white/[0.04] border border-black/10 dark:border-white/10 shadow-sm overflow-x-auto">
          <button
            onClick={() => setTab('pos')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'pos'
                ? 'bg-gradient-to-r from-[#B89047] to-[#8C6826] text-black shadow-md font-bold'
                : 'text-gray-600 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <Barcode size={16} />
            <span>Counter POS & Barcode</span>
          </button>

          <button
            onClick={() => setTab('pickups')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap relative',
              activeTab === 'pickups'
                ? 'bg-gradient-to-r from-[#B89047] to-[#8C6826] text-black shadow-md font-bold'
                : 'text-gray-600 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <PackageCheck size={16} />
            <span>Click & Collect Pickups</span>
            {pendingOrders.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('returns')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'returns'
                ? 'bg-gradient-to-r from-[#B89047] to-[#8C6826] text-black shadow-md font-bold'
                : 'text-gray-600 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <RotateCcw size={16} />
            <span>Returns & Exchanges</span>
          </button>

          <button
            onClick={() => setTab('inventory')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'inventory'
                ? 'bg-gradient-to-r from-[#B89047] to-[#8C6826] text-black shadow-md font-bold'
                : 'text-gray-600 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <Layers size={16} />
            <span>Live Stock & Variants</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: COUNTER POS & SCANNER ─────────────────────────── */}
      {activeTab === 'pos' && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Scanner, Catalog & Variant Cards (8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* Quick Barcode Scanner Bar with Quick Test Chips */}
            <form
              onSubmit={handleSkuScan}
              className="flex flex-col gap-2.5 p-4 rounded-2xl bg-white dark:bg-white/[0.04] border border-black/10 dark:border-white/10 shadow-md"
            >
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={skuInput}
                    onChange={(e) => setSkuInput(e.target.value)}
                    placeholder="Scan Barcode or enter SKU (e.g. YNX-AX88D-3U-BLK or 4907054177064) and press Enter..."
                    className="w-full px-4 py-2.5 pl-10 rounded-xl bg-gray-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-sm text-[#1D1D1F] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/30 focus:border-[#B89047] focus:ring-1 focus:ring-[#B89047] outline-none transition-all font-mono"
                  />
                  <Barcode size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#B89047]" />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-sm"
                >
                  Scan SKU
                </button>
              </div>

              {/* 1-Click Test Chips */}
              <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-black/5 dark:border-white/5">
                <span className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400">Quick Test Chips:</span>
                {[
                  { label: 'Yonex 88D Pro', sku: 'YNX-AX88D-3U-BLK' },
                  { label: 'Wilson Pro Staff 97', sku: 'WLS-PS97-L2-BRD' },
                  { label: 'US Open Balls', sku: 'WLS-USOPEN-CAN3' },
                  { label: 'Delta Pro Padel', sku: 'HED-DLP-370-BLK' },
                  { label: 'Mavis 350 Shuttles', sku: 'YNX-MV350-PKT6' },
                  { label: 'Dri-FIT Polo', sku: 'NKE-DRY-M-WHT' },
                ].map((chip) => (
                  <button
                    key={chip.sku}
                    type="button"
                    onClick={() => {
                      setSkuInput(chip.sku);
                      triggerScan(chip.sku);
                    }}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-black/5 dark:bg-white/5 hover:bg-[#B89047]/20 hover:text-[#B89047] dark:hover:text-[#EAD29A] border border-black/10 dark:border-white/10 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
                  >
                    ⚡ {chip.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setIsSkuPickerOpen(true)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-[#B89047]/15 text-[#B89047] dark:text-[#EAD29A] hover:bg-[#B89047]/25 border border-[#B89047]/30 transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Barcode size={12} />
                  <span>Browse All SKUs</span>
                </button>
              </div>
            </form>

            {/* Category Filter Pills & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search gear by name..."
                  className="w-full px-3.5 py-2 pl-9 rounded-xl bg-white dark:bg-white/[0.04] border border-black/10 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:border-[#B89047] outline-none shadow-sm"
                />
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      'px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all cursor-pointer',
                      selectedCategory === cat
                        ? 'bg-[#B89047] text-black font-bold shadow'
                        : 'bg-white dark:bg-white/[0.03] text-gray-600 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 border border-black/5 dark:border-white/5'
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product & Variant Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredProducts.map((product) => (
                <div
                  key={product.product_id}
                  className="rounded-2xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 p-4 flex flex-col justify-between hover:border-[#B89047]/40 transition-all shadow-sm group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-black/5 dark:bg-white/5 text-[#B89047] dark:text-[#EAD29A]">
                        {product.category}
                      </span>
                      <span className="text-xs text-gray-400 dark:text-white/40 font-mono">
                        {product.variants.length} variant{product.variants.length > 1 ? 's' : ''}
                      </span>
                    </div>

                    <h3 className="font-display font-bold text-base text-[#1D1D1F] dark:text-white mt-2 group-hover:text-[#B89047] dark:group-hover:text-[#EAD29A] transition-colors line-clamp-1">
                      {product.product_name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-white/50 line-clamp-2 mt-1">
                      {product.description || 'High-performance athletic gear endorsed by The Champions Club.'}
                    </p>
                  </div>

                  {/* Variants List */}
                  <div className="mt-4 pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
                    {product.variants.map((v) => (
                      <div
                        key={v.variant_id}
                        className="flex items-center justify-between gap-2 p-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-black/5 dark:border-white/5 hover:border-[#B89047]/30 transition-all text-xs"
                      >
                        <div>
                          <div className="font-medium text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                            {v.size && <span className="text-gray-900 dark:text-white/90">Size: {v.size}</span>}
                            {v.color && <span className="text-gray-500 dark:text-white/60">({v.color})</span>}
                          </div>
                          <div className="text-[10px] text-gray-400 dark:text-white/40 font-mono mt-0.5">
                            SKU: {v.sku} • Stock: <span className={cn(v.stock_quantity <= 2 ? 'text-rose-500 font-bold' : 'text-emerald-600 dark:text-emerald-400')}>{v.stock_quantity}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#B89047] dark:text-[#EAD29A]">
                            ₹{v.price.toLocaleString()}
                          </span>
                          <button
                            onClick={() => addToCart(v)}
                            disabled={v.stock_quantity <= 0}
                            className="p-1.5 rounded-lg bg-[#B89047]/15 hover:bg-[#B89047] text-[#B89047] hover:text-black dark:text-[#EAD29A] dark:hover:text-black transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Add to Cart"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="p-12 text-center rounded-2xl bg-white dark:bg-white/[0.02] border border-black/10 dark:border-white/5">
                <ShoppingBag className="w-12 h-12 text-gray-300 dark:text-white/20 mx-auto mb-3" />
                <p className="text-sm text-gray-500 dark:text-white/60 font-medium">No products match your search or filter</p>
              </div>
            )}
          </div>

          {/* Right Column: Register Cart & Instant Checkout (4 Cols) */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="sticky top-28 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#14141A] dark:to-[#0D0D12] border border-black/10 dark:border-white/10 p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#B89047]/20 flex items-center justify-center text-[#B89047] dark:text-[#EAD29A]">
                    <ShoppingBag size={18} />
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-sm text-[#1D1D1F] dark:text-white">POS Register</h3>
                    <p className="text-[11px] text-gray-400 dark:text-white/50">{cart.length} item{cart.length !== 1 ? 's' : ''} in cart</p>
                  </div>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={clearCart}
                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-gray-400 dark:text-white/40">
                    <Barcode className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">Cart is empty.</p>
                    <p className="text-[11px] text-gray-400 dark:text-white/30 mt-1">Scan a barcode or click "+ Add" on items to begin.</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div
                      key={item.variant_id}
                      className="p-3 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-[#1D1D1F] dark:text-white truncate">{item.product_name}</div>
                        <div className="text-[10px] text-gray-400 dark:text-white/50 font-mono">
                          {item.size ? `Size: ${item.size}` : ''} {item.color ? `• ${item.color}` : ''}
                        </div>
                        <div className="text-[11px] text-[#B89047] dark:text-[#EAD29A] font-semibold mt-0.5">
                          ₹{item.price.toLocaleString()} each
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-white dark:bg-black/50 p-1 rounded-xl border border-black/10 dark:border-white/10 shadow-sm">
                        <button
                          onClick={() => updateCartQty(item.variant_id, -1)}
                          className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center text-gray-700 dark:text-white/80 cursor-pointer"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-5 text-center font-bold font-mono text-[#1D1D1F] dark:text-white text-xs">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateCartQty(item.variant_id, 1)}
                          className="w-6 h-6 rounded-lg bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/15 flex items-center justify-center text-gray-700 dark:text-white/80 cursor-pointer"
                        >
                          <Plus size={12} />
                        </button>
                      </div>

                      <div className="text-right">
                        <div className="font-bold text-[#1D1D1F] dark:text-white text-xs">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </div>
                        <button
                          onClick={() => removeCartItem(item.variant_id)}
                          className="text-rose-400 hover:text-rose-600 p-1 transition-colors cursor-pointer mt-0.5"
                          title="Remove item"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* VIP Discount Selector */}
              {cart.length > 0 && (
                <div className="pt-2 border-t border-black/5 dark:border-white/10">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-white/50 block mb-1.5">
                    Member Tier Discount
                  </label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[0, 5, 10, 15].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setDiscountPct(pct)}
                        className={cn(
                          'py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center',
                          discountPct === pct
                            ? 'bg-[#B89047]/20 border-[#B89047] text-[#B89047] dark:text-[#EAD29A] font-bold'
                            : 'bg-black/5 dark:bg-black/30 border-black/5 dark:border-white/5 text-gray-600 dark:text-white/60 hover:text-black dark:hover:text-white'
                        )}
                      >
                        {pct === 0 ? 'Regular' : `${pct}% Off`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Payment Method Selector */}
              {cart.length > 0 && (
                <div className="pt-2 border-t border-black/5 dark:border-white/10">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 dark:text-white/50 block mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['UPI', 'Card', 'Cash'] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={cn(
                          'py-2 px-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer',
                          paymentMethod === method
                            ? 'bg-[#B89047]/15 border-[#B89047] text-[#B89047] dark:text-white font-bold shadow-sm'
                            : 'bg-black/5 dark:bg-black/30 border-black/5 dark:border-white/5 text-gray-600 dark:text-white/60 hover:text-black dark:hover:text-white'
                        )}
                      >
                        {method === 'UPI' && <QrCode size={13} className="text-[#B89047]" />}
                        {method === 'Card' && <CreditCard size={13} className="text-blue-500" />}
                        {method === 'Cash' && <Banknote size={13} className="text-emerald-500" />}
                        <span>{method}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Totals Summary */}
              {cart.length > 0 && (
                <div className="pt-3 border-t border-black/5 dark:border-white/10 space-y-1.5 text-xs text-gray-600 dark:text-white/70">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono text-[#1D1D1F] dark:text-white font-semibold">₹{subtotal.toLocaleString()}</span>
                  </div>
                  {discountPct > 0 && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Discount ({discountPct}%)</span>
                      <span className="font-mono">-₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t border-black/5 dark:border-white/10 text-[#1D1D1F] dark:text-white font-bold text-sm">
                    <span className="font-display">Grand Total (Inc. GST)</span>
                    <span className="text-xl font-display text-[#B89047] dark:text-[#EAD29A]">
                      ₹{grandTotal.toLocaleString()}
                    </span>
                  </div>
                </div>
              )}

              {/* Checkout Button */}
              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0 || isCheckingOut}
                className="w-full py-3.5 rounded-2xl font-bold text-sm text-black bg-gradient-to-r from-[#EAD29A] via-[#B89047] to-[#8C6826] hover:brightness-105 active:scale-[0.99] transition-all duration-300 shadow-xl shadow-[#B89047]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isCheckingOut ? (
                  <>
                    <RefreshCw size={16} className="animate-spin text-black" />
                    <span>Processing POS Order...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} className="text-black" />
                    <span>Complete Sale (₹{grandTotal.toLocaleString()})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: CLICK & COLLECT ONLINE PICKUPS ────────────────── */}
      {activeTab === 'pickups' && (
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#14141A] border border-black/10 dark:border-white/10 shadow-sm">
            <div>
              <h2 className="text-lg font-display font-bold text-[#1D1D1F] dark:text-white">
                Online Click & Collect Queue
              </h2>
              <p className="text-xs text-gray-500 dark:text-white/50">
                Orders placed online by members awaiting pickup at the pro shop desk.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
              {pendingOrders.length} Pending Handover
            </span>
          </div>

          {pendingOrders.length === 0 ? (
            <div className="p-16 text-center rounded-3xl bg-white dark:bg-[#14141A] border border-black/10 dark:border-white/10 shadow-sm">
              <PackageCheck className="w-16 h-16 text-emerald-500/40 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">All Pickups Up to Date</h3>
              <p className="text-xs text-gray-500 dark:text-white/50 max-w-sm mx-auto mt-1">
                There are currently no outstanding Click & Collect orders awaiting customer collection.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((order) => (
                <div
                  key={order.id}
                  className="p-5 rounded-3xl bg-white dark:bg-[#14141A] border border-black/10 dark:border-white/10 hover:border-[#B89047]/40 transition-all shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-[#B89047] dark:text-[#EAD29A]">
                        #{order.order_no}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        {order.status}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-white/40 flex items-center gap-1 font-mono">
                        <Clock size={12} /> {new Date(order.placed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                      <User size={14} className="text-[#B89047]" />
                      <span>{order.customer_name}</span>
                      {order.customer_phone && (
                        <span className="text-xs text-gray-400 dark:text-white/50 font-mono">({order.customer_phone})</span>
                      )}
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="pt-2 text-xs text-gray-600 dark:text-white/70 space-y-1">
                        {order.items.map((i) => (
                          <div key={i.id} className="flex items-center gap-2 font-mono">
                            <span className="text-[#B89047] dark:text-[#EAD29A] font-bold">{i.quantity}x</span>
                            <span>{i.product_name}</span>
                            <span className="text-gray-400 dark:text-white/40">(@ ₹{i.unit_price})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center md:flex-col items-end justify-between gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-black/5 dark:border-white/5">
                    <div className="text-right">
                      <span className="text-[10px] text-gray-400 dark:text-white/40 uppercase tracking-wider block">Total Paid</span>
                      <span className="text-lg font-bold font-display text-[#1D1D1F] dark:text-white">
                        ₹{Number(order.total_amount).toLocaleString()}
                      </span>
                    </div>

                    <button
                      onClick={() => handleFulfillOrder(order.id)}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      <PackageCheck size={15} />
                      <span>Handover & Fulfill</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: RETURNS & EXCHANGES ───────────────────────────── */}
      {activeTab === 'returns' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#14141A] border border-black/10 dark:border-white/10 shadow-md space-y-4">
            <h2 className="text-lg font-display font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <RotateCcw className="text-[#B89047] dark:text-[#EAD29A]" size={20} />
              <span>Process Member Return & Restock</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-white/60">
              Enter an order number or ID to inspect items, issue a refund, and automatically return items back into inventory.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={returnOrderId}
                onChange={(e) => setReturnOrderId(e.target.value)}
                placeholder="Enter Order # (e.g. POS-1791... or ORD-1791...)"
                className="flex-1 px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-white placeholder:text-gray-400 dark:placeholder:text-white/40 focus:border-[#B89047] outline-none font-mono"
              />
              <button
                type="button"
                onClick={handleLookupOrderForReturn}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 transition-all cursor-pointer shadow-sm"
              >
                Lookup Order
              </button>
            </div>
          </div>

          {returnOrderData && (
            <div className="p-6 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#14141A] dark:to-[#0D0D12] border border-black/10 dark:border-white/10 shadow-xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-black/5 dark:border-white/10">
                <div>
                  <h3 className="font-bold text-[#1D1D1F] dark:text-white text-base">
                    Order #{returnOrderData.order_no}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-white/50">
                    Customer: {returnOrderData.customer_name} • Placed on {new Date(returnOrderData.placed_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-sm font-display font-bold text-[#B89047] dark:text-[#EAD29A]">
                  Total: ₹{Number(returnOrderData.total_amount).toLocaleString()}
                </span>
              </div>

              {/* Items in order */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#1D1D1F] dark:text-white uppercase tracking-wider block">
                  Select Items Being Returned:
                </label>
                {returnOrderData.items?.map((item) => {
                  const isSelected = selectedReturnItems.includes(item.id);
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        setSelectedReturnItems((prev) =>
                          isSelected ? prev.filter((id) => id !== item.id) : [...prev, item.id]
                        );
                      }}
                      className={cn(
                        'p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between text-xs select-none',
                        isSelected
                          ? 'bg-[#B89047]/15 border-[#B89047] text-[#1D1D1F] dark:text-white'
                          : 'bg-gray-50 dark:bg-black/30 border-black/5 dark:border-white/5 text-gray-600 dark:text-white/60 hover:text-black dark:hover:text-white'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'w-5 h-5 rounded-md border flex items-center justify-center text-black font-bold transition-all',
                            isSelected ? 'bg-[#EAD29A] border-[#EAD29A]' : 'border-black/20 dark:border-white/20'
                          )}
                        >
                          {isSelected && '✓'}
                        </div>
                        <div>
                          <div className="font-bold text-[#1D1D1F] dark:text-white">{item.product_name}</div>
                          <div className="text-[10px] text-gray-400 dark:text-white/50 font-mono">
                            Qty: {item.quantity} • Unit Price: ₹{item.unit_price}
                          </div>
                        </div>
                      </div>

                      <span className="font-bold text-[#B89047] dark:text-[#EAD29A]">
                        ₹{item.line_total.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Return Reason */}
              <div>
                <label className="text-xs font-bold text-[#1D1D1F] dark:text-white uppercase tracking-wider block mb-1.5">
                  Reason for Return
                </label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-white outline-none focus:border-[#B89047]"
                >
                  <option value="Size exchange / Customer preference">Size exchange / Customer preference</option>
                  <option value="Damaged or defective item">Damaged or defective item</option>
                  <option value="Wrong item supplied">Wrong item supplied</option>
                  <option value="Customer changed mind">Customer changed mind</option>
                </select>
              </div>

              {/* Submit Return */}
              <button
                type="button"
                onClick={handleProcessReturn}
                disabled={isProcessingReturn || selectedReturnItems.length === 0}
                className="w-full py-3.5 rounded-2xl text-xs sm:text-sm font-bold text-black bg-gradient-to-r from-amber-400 to-[#B89047] hover:brightness-105 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
              >
                {isProcessingReturn ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />
                    <span>Processing Restock...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw size={15} />
                    <span>Authorize Return & Restock Inventory</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: LIVE STOCK & VARIANTS ─────────────────────────── */}
      {activeTab === 'inventory' && (
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-white dark:bg-[#14141A] border border-black/10 dark:border-white/10 shadow-sm">
            <div>
              <h2 className="text-lg font-display font-bold text-[#1D1D1F] dark:text-white">
                Live SKU Inventory & Stock Levels
              </h2>
              <p className="text-xs text-gray-500 dark:text-white/50">
                Real-time stock balance directly synchronized with physical shelf inventory and sales orders.
              </p>
            </div>
            <div className="text-xs text-gray-500 dark:text-white/60 font-mono">
              Total Variants: <strong className="text-[#1D1D1F] dark:text-white">{flatVariants.length}</strong>
            </div>
          </div>

          <div className="rounded-3xl bg-white dark:bg-[#14141A] border border-black/10 dark:border-white/10 overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-100 dark:bg-black/40 border-b border-black/10 dark:border-white/10 text-gray-500 dark:text-white/50 uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-3 px-4">SKU / Barcode</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Size / Color</th>
                    <th className="py-3 px-4">Unit Price</th>
                    <th className="py-3 px-4 text-center">Stock on Hand</th>
                    <th className="py-3 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-gray-700 dark:text-white/80 font-sans">
                  {flatVariants.map((item) => (
                    <tr key={item.variant_id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-[#1D1D1F] dark:text-white/90">
                        <div className="font-bold text-[#B89047] dark:text-[#EAD29A]">{item.sku}</div>
                        {item.barcode && <div className="text-[10px] text-gray-400 dark:text-white/40">{item.barcode}</div>}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#1D1D1F] dark:text-white">
                        {item.product_name}
                      </td>
                      <td className="py-3 px-4 text-gray-500 dark:text-white/60">
                        {item.category_name || 'General'}
                      </td>
                      <td className="py-3 px-4 font-mono">
                        {item.size || '—'} {item.color ? `(${item.color})` : ''}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#1D1D1F] dark:text-white font-mono">
                        ₹{item.price.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center font-bold font-mono">
                        <span
                          className={cn(
                            'px-2.5 py-1 rounded-full text-xs',
                            item.stock_quantity <= 2
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                              : item.stock_quantity <= 5
                              ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                          )}
                        >
                          {item.stock_quantity}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {item.stock_quantity <= 2 ? (
                          <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 flex items-center justify-end gap-1">
                            <AlertTriangle size={12} /> Low Stock
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-end gap-1">
                            <CheckCircle2 size={12} /> Available
                          </span>
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

      {/* ── MODAL: INTERACTIVE SKU PICKER / CATALOG ───────────────── */}
      {isSkuPickerOpen && typeof document !== 'undefined' && createPortal(
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#14141A] border border-black/10 dark:border-white/10 p-6 shadow-2xl space-y-4 text-xs max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10 flex-shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#B89047]/15 flex items-center justify-center text-[#B89047]">
                  <Barcode size={18} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-[#1D1D1F] dark:text-white">
                    Scan SKU / Interactive Product Picker
                  </h3>
                  <p className="text-[11px] text-gray-500 dark:text-white/50">
                    Click any active product SKU to immediately scan and load into the POS checkout cart.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsSkuPickerOpen(false);
                  setSkuPickerSearch('');
                }}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="relative flex-shrink-0">
              <input
                type="text"
                value={skuPickerSearch}
                onChange={(e) => setSkuPickerSearch(e.target.value)}
                placeholder="Filter by SKU code, product name, or barcode..."
                className="w-full px-3.5 py-2 pl-9 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-xs text-[#1D1D1F] dark:text-white outline-none focus:border-[#B89047]"
                autoFocus
              />
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            </div>

            {/* List of Scannable Variants */}
            <div className="overflow-y-auto space-y-2 pr-1 flex-1">
              {flatVariants
                .filter((v) => {
                  const q = skuPickerSearch.toLowerCase();
                  if (!q) return true;
                  return (
                    v.sku.toLowerCase().includes(q) ||
                    (v.barcode && v.barcode.toLowerCase().includes(q)) ||
                    (v.product_name && v.product_name.toLowerCase().includes(q)) ||
                    (v.category_name && v.category_name.toLowerCase().includes(q))
                  );
                })
                .map((variant) => (
                  <div
                    key={variant.variant_id}
                    className="p-3 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-black/5 dark:border-white/5 flex items-center justify-between gap-3 hover:border-[#B89047]/40 transition-all group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[#B89047] dark:text-[#EAD29A]">
                          {variant.sku}
                        </span>
                        {variant.category_name && (
                          <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded bg-black/5 dark:bg-white/5 text-gray-600 dark:text-white/60">
                            {variant.category_name}
                          </span>
                        )}
                        <span className="text-[10px] font-mono text-gray-400">
                          Stock: {variant.stock_quantity}
                        </span>
                      </div>
                      <p className="font-medium text-xs text-[#1D1D1F] dark:text-white">
                        {variant.product_name}
                      </p>
                      <div className="text-[11px] text-gray-500 dark:text-white/50 font-mono">
                        {variant.size && <span>Size: {variant.size} </span>}
                        {variant.color && <span>• Color: {variant.color} </span>}
                        {variant.barcode && <span>• Barcode: {variant.barcode}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-display font-bold text-sm text-[#1D1D1F] dark:text-white">
                        ₹{variant.price.toLocaleString()}
                      </span>
                      <button
                        onClick={() => {
                          addToCart(variant);
                          setIsSkuPickerOpen(false);
                          setSkuPickerSearch('');
                          toast.success(`Scanned & added: ${variant.product_name}`);
                        }}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                      >
                        <Plus size={14} />
                        <span>Scan & Add</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ── LAST RECEIPT MODAL ────────────────────────────────────── */}
      {lastReceipt && typeof document !== 'undefined' && createPortal(
        <div
          data-lenis-prevent="true"
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#14141A] border border-black/10 dark:border-[#B89047]/40 p-6 shadow-2xl space-y-4 text-[#1D1D1F] dark:text-white">
            <div className="text-center pb-3 border-b border-black/5 dark:border-white/10">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 size={24} />
              </div>
              <h3 className="font-display font-bold text-lg text-[#1D1D1F] dark:text-white">Sale Successful</h3>
              <p className="text-[11px] text-gray-500 dark:text-white/50">The Champions Club Pro Shop</p>
            </div>

            <div className="space-y-1.5 text-xs text-gray-600 dark:text-white/70 font-mono">
              <div className="flex justify-between">
                <span>Order No:</span>
                <span className="text-[#1D1D1F] dark:text-white font-bold">{lastReceipt.orderNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Receipt No:</span>
                <span className="text-[#B89047] dark:text-[#EAD29A]">{lastReceipt.receiptNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment:</span>
                <span className="text-[#1D1D1F] dark:text-white">{lastReceipt.paymentMethod}</span>
              </div>
              <div className="flex justify-between">
                <span>Date:</span>
                <span className="text-gray-400 dark:text-white/60">{lastReceipt.date}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-black/5 dark:border-white/10 space-y-1 text-xs">
              {lastReceipt.items?.map((item: any) => (
                <div key={item.variant_id} className="flex justify-between text-gray-700 dark:text-white/80">
                  <span>{item.quantity}x {item.product_name}</span>
                  <span className="font-mono">₹{(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-sm text-[#1D1D1F] dark:text-white pt-2 border-t border-black/5 dark:border-white/10 font-display">
                <span>Total Paid</span>
                <span className="text-[#B89047] dark:text-[#EAD29A]">₹{lastReceipt.totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl text-xs font-semibold text-gray-700 dark:text-white bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer size={14} />
                <span>Print</span>
              </button>
              <button
                onClick={() => setLastReceipt(null)}
                className="flex-1 py-2.5 rounded-xl text-xs font-bold text-black bg-[#EAD29A] hover:bg-[#B89047] transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ShopStaffPage;
