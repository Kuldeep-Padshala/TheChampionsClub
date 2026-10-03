import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams, Link } from 'react-router-dom';
import { PageLayout } from '../components/layout/PageLayout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { ROUTES } from '../constants/routes';
import { CLUB_INFO } from '../constants/club';
import { managerService } from '../services/managerService';
import {
  ManagerCourt,
  ManagerCourtRate,
  ManagerInventoryItem,
  ManagerStockMovement,
  ManagerBarItem,
  ManagerInvoice,
  ManagerEmployee,
  ManagerShift,
  ManagerLeave,
  ManagerDailyClosing,
  ManagerDailySummary,
} from '../types/manager.types';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  Plus,
  ShieldAlert,
  Search,
  Filter,
  Check,
  X,
  CreditCard,
  Building2,
  Package,
  Coffee,
  UserCheck,
  ChevronRight,
  SlidersHorizontal,
  FileText,
  BadgeAlert,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  Unlock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../utils/cn';

export const ManagerPage: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isNight = theme === 'night';

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTab = searchParams.get('tab') as 'finance' | 'courts' | 'overrides' | 'inventory' | 'hr' | null;

  const [activeTab, setActiveTab] = useState<'finance' | 'courts' | 'overrides' | 'inventory' | 'hr'>(
    urlTab && ['finance', 'courts', 'overrides', 'inventory', 'hr'].includes(urlTab) ? urlTab : 'finance'
  );

  useEffect(() => {
    if (urlTab && ['finance', 'courts', 'overrides', 'inventory', 'hr'].includes(urlTab) && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [urlTab, activeTab]);

  const handleTabChange = (tab: 'finance' | 'courts' | 'overrides' | 'inventory' | 'hr') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Global Date Filter for Reports & Summaries (defaults to today)
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  // ══════════════════════════════════════════════════════════════
  // TAB 1: FINANCE & REGISTER CLOSINGS STATE
  // ══════════════════════════════════════════════════════════════
  const [dailySummary, setDailySummary] = useState<ManagerDailySummary | null>(null);
  const [dailyClosings, setDailyClosings] = useState<ManagerDailyClosing[]>([]);
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);
  const [closingDepartment, setClosingDepartment] = useState('Front Desk & Pro Shop');
  const [closingOpeningCash, setClosingOpeningCash] = useState<number>(5000);
  const [closingCountedCash, setClosingCountedCash] = useState<string>('');
  const [closingNotes, setClosingNotes] = useState('');
  const [isSubmittingClosing, setIsSubmittingClosing] = useState(false);

  // ══════════════════════════════════════════════════════════════
  // TAB 2: COURT OPERATIONS & TARIFFS STATE
  // ══════════════════════════════════════════════════════════════
  const [courts, setCourts] = useState<ManagerCourt[]>([]);
  const [courtRates, setCourtRates] = useState<ManagerCourtRate[]>([]);
  const [selectedCourtForEdit, setSelectedCourtForEdit] = useState<ManagerCourt | null>(null);
  const [editCourtStatus, setEditCourtStatus] = useState<string>('available');
  const [editCourtNotes, setEditCourtNotes] = useState<string>('');
  const [isSubmittingCourtEdit, setIsSubmittingCourtEdit] = useState(false);

  const [selectedRateForEdit, setSelectedRateForEdit] = useState<ManagerCourtRate | null>(null);
  const [editRatePrice, setEditRatePrice] = useState<string>('');
  const [editRateActive, setEditRateActive] = useState<number>(1);
  const [isSubmittingRateEdit, setIsSubmittingRateEdit] = useState(false);

  // ══════════════════════════════════════════════════════════════
  // TAB 3: OVERRIDES & VOIDS STATE
  // ══════════════════════════════════════════════════════════════
  const [isForceBookingModalOpen, setIsForceBookingModalOpen] = useState(false);
  const [forceCourtId, setForceCourtId] = useState<number | ''>('');
  const [forceStartsAt, setForceStartsAt] = useState<string>('');
  const [forceEndsAt, setForceEndsAt] = useState<string>('');
  const [forceReservationType, setForceReservationType] = useState<string>('exclusive');
  const [forceNotes, setForceNotes] = useState<string>('');
  const [isSubmittingForceBooking, setIsSubmittingForceBooking] = useState(false);

  const [invoices, setInvoices] = useState<ManagerInvoice[]>([]);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [invoiceFilterStatus, setInvoiceFilterStatus] = useState('all');
  const [selectedInvoiceForVoid, setSelectedInvoiceForVoid] = useState<ManagerInvoice | null>(null);
  const [voidReason, setVoidReason] = useState('');
  const [isSubmittingVoid, setIsSubmittingVoid] = useState(false);

  // ══════════════════════════════════════════════════════════════
  // TAB 4: INVENTORY & BAR STATE
  // ══════════════════════════════════════════════════════════════
  const [inventorySubTab, setInventorySubTab] = useState<'proshop' | 'bar' | 'movements'>('proshop');
  const [inventoryItems, setInventoryItems] = useState<ManagerInventoryItem[]>([]);
  const [stockMovements, setStockMovements] = useState<ManagerStockMovement[]>([]);
  const [barItems, setBarItems] = useState<ManagerBarItem[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');

  // Stock Adjustment Modal
  const [selectedVariantForAdjust, setSelectedVariantForAdjust] = useState<ManagerInventoryItem | null>(null);
  const [adjustQtyChange, setAdjustQtyChange] = useState<number>(0);
  const [adjustReason, setAdjustReason] = useState<string>('restock');
  const [adjustNotes, setAdjustNotes] = useState<string>('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState(false);

  // Bar Item Edit Modal
  const [selectedBarItemForEdit, setSelectedBarItemForEdit] = useState<ManagerBarItem | null>(null);
  const [editBarPrice, setEditBarPrice] = useState<string>('');
  const [editBarAvailable, setEditBarAvailable] = useState<number>(1);
  const [isSubmittingBarEdit, setIsSubmittingBarEdit] = useState(false);

  // ══════════════════════════════════════════════════════════════
  // TAB 5: STAFF & SHIFTS (HR) STATE
  // ══════════════════════════════════════════════════════════════
  const [hrSubTab, setHrSubTab] = useState<'employees' | 'shifts' | 'leaves'>('employees');
  const [employees, setEmployees] = useState<ManagerEmployee[]>([]);
  const [shifts, setShifts] = useState<ManagerShift[]>([]);
  const [leaves, setLeaves] = useState<ManagerLeave[]>([]);

  // Shift Modal
  const [isCreateShiftModalOpen, setIsCreateShiftModalOpen] = useState(false);
  const [shiftEmployeeId, setShiftEmployeeId] = useState<number | ''>('');
  const [shiftDepartment, setShiftDepartment] = useState('Front Desk');
  const [shiftStartsAt, setShiftStartsAt] = useState('');
  const [shiftEndsAt, setShiftEndsAt] = useState('');
  const [shiftNotes, setShiftNotes] = useState('');
  const [isSubmittingShift, setIsSubmittingShift] = useState(false);

  // Leave Decision Modal
  const [selectedLeaveForDecision, setSelectedLeaveForDecision] = useState<{
    leave: ManagerLeave;
    action: 'approved' | 'rejected';
  } | null>(null);
  const [decisionNote, setDecisionNote] = useState('');
  const [isSubmittingLeaveDecision, setIsSubmittingLeaveDecision] = useState(false);

  // ══════════════════════════════════════════════════════════════
  // INITIAL DATA FETCH & TAB SYNC
  // ══════════════════════════════════════════════════════════════
  const loadTabContent = async (tab: typeof activeTab, date = selectedDate) => {
    setIsRefreshing(true);
    try {
      if (tab === 'finance') {
        const [sum, closings] = await Promise.all([
          managerService.getDailySummary(date),
          managerService.getDailyClosings(),
        ]);
        setDailySummary(sum);
        setDailyClosings(closings);
      } else if (tab === 'courts') {
        const [cList, rList] = await Promise.all([
          managerService.getCourts(),
          managerService.getCourtRates(),
        ]);
        setCourts(cList);
        setCourtRates(rList);
      } else if (tab === 'overrides') {
        const [cList, invList] = await Promise.all([
          managerService.getCourts(),
          managerService.getInvoices(),
        ]);
        setCourts(cList);
        setInvoices(invList);
      } else if (tab === 'inventory') {
        const [inv, bar, mov] = await Promise.all([
          managerService.getInventory(),
          managerService.getBarMenu(),
          managerService.getStockMovements(),
        ]);
        setInventoryItems(inv);
        setBarItems(bar);
        setStockMovements(mov);
      } else if (tab === 'hr') {
        const [emp, shf, lvs] = await Promise.all([
          managerService.getEmployees(),
          managerService.getShifts(),
          managerService.getLeaves(),
        ]);
        setEmployees(emp);
        setShifts(shf);
        setLeaves(lvs);
      }
    } catch (err: any) {
      console.error('Failed to load manager data:', err);
      toast.error(err?.response?.data?.message || 'Could not synchronize executive data');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTabContent(activeTab, selectedDate);
  }, [activeTab, selectedDate]);

  // ══════════════════════════════════════════════════════════════
  // TAB 1 ACTIONS: REGISTER CLOSING
  // ══════════════════════════════════════════════════════════════
  const handleOpenRegisterClosing = () => {
    if (!dailySummary) return;
    const cashTotal = Number(
      dailySummary.payment_breakdown.find((p) => p.payment_method?.toLowerCase() === 'cash')?.total || 0
    );
    const expected = closingOpeningCash + cashTotal;
    setClosingCountedCash(expected.toString());
    setIsClosingModalOpen(true);
  };

  const handlePerformClosing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailySummary) return;
    const cashTotal = Number(
      dailySummary.payment_breakdown.find((p) => p.payment_method?.toLowerCase() === 'cash')?.total || 0
    );
    const cardTotal = Number(
      dailySummary.payment_breakdown.find((p) => p.payment_method?.toLowerCase() === 'card')?.total || 0
    );
    const upiTotal = Number(
      dailySummary.payment_breakdown.find((p) => p.payment_method?.toLowerCase() === 'upi')?.total || 0
    );
    const counted = Number(closingCountedCash) || 0;
    const expected = closingOpeningCash + cashTotal;

    setIsSubmittingClosing(true);
    try {
      const res = await managerService.closeRegister({
        business_date: selectedDate,
        department: closingDepartment,
        total_sales: dailySummary.total_revenue,
        cash_total: cashTotal,
        card_total: cardTotal,
        upi_total: upiTotal,
        opening_cash: closingOpeningCash,
        expected_cash: expected,
        counted_cash: counted,
        notes: closingNotes.trim() || undefined,
      });

      toast.success(res.message || 'Register closed successfully!');
      setIsClosingModalOpen(false);
      setClosingNotes('');
      // Refresh closings
      const updatedClosings = await managerService.getDailyClosings();
      setDailyClosings(updatedClosings);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to close register');
    } finally {
      setIsSubmittingClosing(false);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // TAB 2 ACTIONS: COURTS & TARIFFS
  // ══════════════════════════════════════════════════════════════
  const handleSaveCourtStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourtForEdit) return;
    setIsSubmittingCourtEdit(true);
    try {
      const res = await managerService.updateCourt(
        selectedCourtForEdit.id,
        editCourtStatus,
        editCourtNotes.trim() || undefined
      );
      toast.success(res.message || 'Court status updated');
      setSelectedCourtForEdit(null);
      const updated = await managerService.getCourts();
      setCourts(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update court status');
    } finally {
      setIsSubmittingCourtEdit(false);
    }
  };

  const handleSaveCourtRate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRateForEdit) return;
    const priceNum = parseFloat(editRatePrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid positive price');
      return;
    }
    setIsSubmittingRateEdit(true);
    try {
      const res = await managerService.updateCourtRate(
        selectedRateForEdit.id,
        priceNum,
        editRateActive
      );
      toast.success(res.message || 'Court tariff updated');
      setSelectedRateForEdit(null);
      const updated = await managerService.getCourtRates();
      setCourtRates(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update tariff');
    } finally {
      setIsSubmittingRateEdit(false);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // TAB 3 ACTIONS: OVERRIDES & VOID INVOICE
  // ══════════════════════════════════════════════════════════════
  const handleForceBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forceCourtId || !forceStartsAt || !forceEndsAt) {
      toast.error('Please select court, start time, and end time');
      return;
    }
    if (!forceNotes.trim()) {
      toast.error('Manager audit note is mandatory for VIP overrides');
      return;
    }

    setIsSubmittingForceBooking(true);
    try {
      const res = await managerService.forceBookCourt({
        court_id: Number(forceCourtId),
        starts_at: forceStartsAt.replace('T', ' '),
        ends_at: forceEndsAt.replace('T', ' '),
        reservation_type: forceReservationType,
        notes: forceNotes.trim(),
      });
      toast.success(`VIP Override Created! Booking ref: ${res.bookingRef}`);
      setIsForceBookingModalOpen(false);
      setForceNotes('');
      setForceCourtId('');
      setForceStartsAt('');
      setForceEndsAt('');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'VIP override failed');
    } finally {
      setIsSubmittingForceBooking(false);
    }
  };

  const handleVoidInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForVoid) return;
    if (!voidReason.trim()) {
      toast.error('Audit void reason is required');
      return;
    }
    setIsSubmittingVoid(true);
    try {
      const res = await managerService.voidInvoice(selectedInvoiceForVoid.id, voidReason.trim());
      toast.success(res.message || 'Invoice successfully voided');
      setSelectedInvoiceForVoid(null);
      setVoidReason('');
      const updated = await managerService.getInvoices();
      setInvoices(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to void invoice');
    } finally {
      setIsSubmittingVoid(false);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // TAB 4 ACTIONS: INVENTORY & BAR MENU
  // ══════════════════════════════════════════════════════════════
  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVariantForAdjust) return;
    if (adjustQtyChange === 0) {
      toast.error('Adjustment quantity cannot be 0');
      return;
    }

    setIsSubmittingAdjust(true);
    try {
      const res = await managerService.adjustInventory({
        variant_id: selectedVariantForAdjust.id,
        quantity_change: adjustQtyChange,
        reason: adjustReason,
        notes: adjustNotes.trim() || undefined,
      });
      toast.success(res.message || `Stock updated to ${res.new_stock}`);
      setSelectedVariantForAdjust(null);
      setAdjustQtyChange(0);
      setAdjustNotes('');
      // Reload inventory & movements
      const [inv, mov] = await Promise.all([
        managerService.getInventory(),
        managerService.getStockMovements(),
      ]);
      setInventoryItems(inv);
      setStockMovements(mov);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to adjust stock');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  const handleSaveBarItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarItemForEdit) return;
    const priceNum = parseFloat(editBarPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      toast.error('Please enter a valid price');
      return;
    }
    setIsSubmittingBarEdit(true);
    try {
      const res = await managerService.updateBarMenu(selectedBarItemForEdit.id, {
        price: priceNum,
        is_available: editBarAvailable,
      });
      toast.success(res.message || 'Bar item updated');
      setSelectedBarItemForEdit(null);
      const updated = await managerService.getBarMenu();
      setBarItems(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update bar item');
    } finally {
      setIsSubmittingBarEdit(false);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // TAB 5 ACTIONS: STAFF & LEAVES (HR)
  // ══════════════════════════════════════════════════════════════
  const handleCreateShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftEmployeeId || !shiftStartsAt || !shiftEndsAt) {
      toast.error('Please select employee, start time, and end time');
      return;
    }
    setIsSubmittingShift(true);
    try {
      const res = await managerService.createShift({
        employee_id: Number(shiftEmployeeId),
        department: shiftDepartment,
        starts_at: shiftStartsAt.replace('T', ' '),
        ends_at: shiftEndsAt.replace('T', ' '),
        notes: shiftNotes.trim() || undefined,
      });
      toast.success(res.message || 'Staff shift assigned successfully');
      setIsCreateShiftModalOpen(false);
      setShiftEmployeeId('');
      setShiftStartsAt('');
      setShiftEndsAt('');
      setShiftNotes('');
      const updated = await managerService.getShifts();
      setShifts(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create shift');
    } finally {
      setIsSubmittingShift(false);
    }
  };

  const handleLeaveDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLeaveForDecision) return;
    setIsSubmittingLeaveDecision(true);
    try {
      const res = await managerService.approveLeave(
        selectedLeaveForDecision.leave.id,
        selectedLeaveForDecision.action,
        decisionNote.trim() || undefined
      );
      toast.success(res.message || `Leave ${selectedLeaveForDecision.action}`);
      setSelectedLeaveForDecision(null);
      setDecisionNote('');
      const updated = await managerService.getLeaves();
      setLeaves(updated);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to process leave');
    } finally {
      setIsSubmittingLeaveDecision(false);
    }
  };

  // ══════════════════════════════════════════════════════════════
  // FILTERED DATA HELPERS
  // ══════════════════════════════════════════════════════════════
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoice_no?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.bill_to_name?.toLowerCase().includes(invoiceSearch.toLowerCase()) ||
        inv.member_name?.toLowerCase().includes(invoiceSearch.toLowerCase());
      const matchesStatus =
        invoiceFilterStatus === 'all' || inv.status?.toLowerCase() === invoiceFilterStatus.toLowerCase();
      return matchesSearch && matchesStatus;
    });
  }, [invoices, invoiceSearch, invoiceFilterStatus]);

  const filteredInventoryItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      return (
        item.product_name?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.sku?.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        item.brand?.toLowerCase().includes(inventorySearch.toLowerCase())
      );
    });
  }, [inventoryItems, inventorySearch]);

  return (
    <PageLayout>
      <div className="min-h-screen pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* ══════════════════════════════════════════════════════════════
            LUXURY EXECUTIVE HERO HEADER
            ══════════════════════════════════════════════════════════════ */}
        <div className="relative rounded-3xl p-6 sm:p-8 mb-8 overflow-hidden border border-black/10 dark:border-white/10 bg-white/70 dark:bg-[#0A0A0D]/80 backdrop-blur-2xl shadow-xl">
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#B89047]/15 via-transparent to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-14 h-14 rounded-2xl p-[2px] bg-gradient-to-br from-[#EAD29A] via-[#B89047] to-[#7D5A1E] flex-shrink-0 shadow-lg shadow-[#B89047]/20">
                <div className="w-full h-full rounded-2xl bg-[#121214] flex items-center justify-center">
                  <Briefcase className="w-7 h-7 text-[#EAD29A]" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] px-2 py-0.5 rounded-full bg-[#B89047]/15 text-[#B89047] border border-[#B89047]/30">
                    Executive Suite
                  </span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Logged in as <strong>{user?.name || 'General Manager'}</strong>
                  </span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-bold text-[#1D1D1F] dark:text-white mt-1 tracking-tight">
                  Manager Operations Console
                </h1>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  Tariff configurations, financial closings, VIP overrides, stock oversight & human resources.
                </p>
              </div>
            </div>

            {/* Date Selector & Sync Controls */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-white/90 dark:bg-white/[0.04] border border-black/10 dark:border-white/10 px-3 py-1.5 rounded-xl shadow-sm">
                <Calendar size={14} className="text-[#B89047]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-[#1D1D1F] dark:text-white outline-none cursor-pointer"
                />
              </div>

              <button
                type="button"
                onClick={() => loadTabContent(activeTab, selectedDate)}
                disabled={isRefreshing}
                className="w-10 h-10 rounded-xl border border-black/10 dark:border-white/10 bg-white/90 dark:bg-white/[0.04] flex items-center justify-center text-[#B89047] hover:border-[#B89047]/50 active:scale-95 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                title="Refresh Live Data"
              >
                <RotateCw size={15} className={cn(isRefreshing && 'animate-spin')} />
              </button>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════
              EXECUTIVE NAVIGATION PILLS
              ══════════════════════════════════════════════════════════════ */}
          <div className="flex items-center gap-2 mt-8 overflow-x-auto pb-1 scrollbar-none border-t border-black/5 dark:border-white/10 pt-5">
            {[
              { id: 'finance',    label: 'Overview & Closings', icon: TrendingUp },
              { id: 'courts',     label: 'Courts & Tariffs',    icon: Building2 },
              { id: 'overrides',  label: 'VIP Overrides & Voids', icon: ShieldAlert },
              { id: 'inventory',  label: 'Inventory & Bar',      icon: Package },
              { id: 'hr',         label: 'Staff & Shifts (HR)',  icon: Users },
            ].map(({ id, label, icon: Icon }) => {
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
                </button>
              );
            })}
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════
            TAB 1: FINANCIAL OVERVIEW & DAILY CLOSINGS
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'finance' && (
          <div className="space-y-8">
            {/* Top KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Metric 1: Today's Revenue */}
              <div className="rounded-2xl p-5 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
                  <span className="text-xs uppercase font-semibold tracking-wider font-display">
                    Today's Revenue
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <DollarSign size={16} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#1D1D1F] dark:text-white font-display">
                  ₹{Number(dailySummary?.total_revenue || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                  <span>Across all departments on {selectedDate}</span>
                </div>
              </div>

              {/* Metric 2: Outstanding Receivables */}
              <div className="rounded-2xl p-5 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
                  <span className="text-xs uppercase font-semibold tracking-wider font-display">
                    Receivables / Dues
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <CreditCard size={16} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#1D1D1F] dark:text-white font-display">
                  ₹{Number(dailySummary?.outstanding_dues || 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                  <span>Pending membership / booking dues</span>
                </div>
              </div>

              {/* Metric 3: Active Members */}
              <div className="rounded-2xl p-5 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
                  <span className="text-xs uppercase font-semibold tracking-wider font-display">
                    Active Members
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 flex items-center justify-center">
                    <Users size={16} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#1D1D1F] dark:text-white font-display">
                  {dailySummary?.active_members || 0}
                </div>
                <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                  <span>Enrolled with valid active pass</span>
                </div>
              </div>

              {/* Metric 4: Daily Traffic */}
              <div className="rounded-2xl p-5 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
                <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-2">
                  <span className="text-xs uppercase font-semibold tracking-wider font-display">
                    Check-Ins & Courts
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                </div>
                <div className="text-2xl font-bold text-[#1D1D1F] dark:text-white font-display">
                  {dailySummary?.today_checkins || 0} / {dailySummary?.today_bookings || 0}
                </div>
                <div className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                  <span>Check-ins completed vs Reservations</span>
                </div>
              </div>
            </div>

            {/* Payment Method Breakdown & Invoice Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Payment Methods */}
              <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
                <h3 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-[#B89047]" />
                  <span>Collections by Payment Channel</span>
                </h3>
                {dailySummary?.payment_breakdown && dailySummary.payment_breakdown.length > 0 ? (
                  <div className="space-y-3">
                    {dailySummary.payment_breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#B89047]" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-gray-700 dark:text-gray-200">
                            {item.payment_method || 'Other'}
                          </span>
                          <span className="text-[10px] text-gray-400">({item.count} txns)</span>
                        </div>
                        <span className="text-sm font-bold text-[#1D1D1F] dark:text-white font-display">
                          ₹{Number(item.total).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic py-6 text-center">
                    No transactions recorded for {selectedDate}.
                  </p>
                )}
              </div>

              {/* Invoice Health */}
              <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
                <h3 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white mb-4 flex items-center gap-2">
                  <FileText size={18} className="text-[#B89047]" />
                  <span>Invoicing & Receivables Status</span>
                </h3>
                {dailySummary?.invoice_breakdown && dailySummary.invoice_breakdown.length > 0 ? (
                  <div className="space-y-3">
                    {dailySummary.invoice_breakdown.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/[0.03] border border-black/5 dark:border-white/5"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={cn(
                              'w-2 h-2 rounded-full',
                              item.status === 'paid'
                                ? 'bg-emerald-500'
                                : item.status === 'unpaid'
                                ? 'bg-amber-500'
                                : item.status === 'voided'
                                ? 'bg-red-500'
                                : 'bg-blue-500'
                            )}
                          />
                          <span className="text-xs font-semibold capitalize text-gray-700 dark:text-gray-200">
                            {item.status} Invoices
                          </span>
                          <span className="text-[10px] text-gray-400">({item.count} count)</span>
                        </div>
                        <span className="text-sm font-bold text-[#1D1D1F] dark:text-white font-display">
                          ₹{Number(item.total).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic py-6 text-center">
                    No invoices generated on {selectedDate}.
                  </p>
                )}
              </div>
            </div>

            {/* Daily Register Closings Section */}
            <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    End-of-Day Financial Register Closings
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Reconcile counted cash with POS revenue, log cash variances, and archive day balances.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleOpenRegisterClosing}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] hover:opacity-90 shadow-md border border-[#B89047]/30 flex items-center gap-2 cursor-pointer"
                >
                  <Lock size={14} />
                  <span>Execute Day-End Closing</span>
                </button>
              </div>

              {/* Closings Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Department</th>
                      <th className="py-3 px-3">Sales Total</th>
                      <th className="py-3 px-3">Cash Expected</th>
                      <th className="py-3 px-3">Cash Counted</th>
                      <th className="py-3 px-3">Variance</th>
                      <th className="py-3 px-3">Closed By</th>
                      <th className="py-3 px-3">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {dailyClosings.length > 0 ? (
                      dailyClosings.map((c) => {
                        const varianceNum = Number(c.cash_variance);
                        return (
                          <tr key={c.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                            <td className="py-3 px-3 font-semibold text-[#1D1D1F] dark:text-white">
                              {c.business_date ? new Date(c.business_date).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{c.department}</td>
                            <td className="py-3 px-3 font-bold text-[#1D1D1F] dark:text-white">
                              ₹{Number(c.total_sales).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-gray-500">₹{Number(c.expected_cash).toLocaleString()}</td>
                            <td className="py-3 px-3 font-semibold text-[#1D1D1F] dark:text-white">
                              ₹{Number(c.counted_cash).toLocaleString()}
                            </td>
                            <td className="py-3 px-3">
                              <span
                                className={cn(
                                  'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold',
                                  varianceNum === 0
                                    ? 'bg-emerald-500/15 text-emerald-500'
                                    : varianceNum > 0
                                    ? 'bg-blue-500/15 text-blue-500'
                                    : 'bg-red-500/15 text-red-500'
                                )}
                              >
                                {varianceNum >= 0 ? `+₹${varianceNum}` : `-₹${Math.abs(varianceNum)}`}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                              {c.closed_by_name || 'System Admin'}
                            </td>
                            <td className="py-3 px-3 text-gray-400">
                              {new Date(c.closed_at).toLocaleString([], {
                                dateStyle: 'short',
                                timeStyle: 'short',
                              })}
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-gray-400 italic">
                          No previous register closings recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 2: COURT OPERATIONS & TARIFF MATRIX
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'courts' && (
          <div className="space-y-8">
            {/* Court Status Operations */}
            <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Club Courts & Arenas Live Status
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Set court availability, place courts under maintenance, or lock for private events.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {courts.map((court) => (
                  <div
                    key={court.id}
                    className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#B89047]">
                          {court.sport_name || 'Arena'}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                            court.status === 'available'
                              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                              : court.status === 'maintenance'
                              ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                              : 'bg-red-500/15 text-red-500 border border-red-500/30'
                          )}
                        >
                          {court.status}
                        </span>
                      </div>
                      <h4 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white">
                        {court.name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {court.surface} • {court.is_indoor ? 'Indoor Air-conditioned' : 'Outdoor Championship'}
                      </p>
                      {court.notes && (
                        <p className="text-[11px] text-amber-600 dark:text-amber-400 bg-amber-500/10 p-2 rounded-lg mt-2">
                          Note: {court.notes}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCourtForEdit(court);
                        setEditCourtStatus(court.status);
                        setEditCourtNotes(court.notes || '');
                      }}
                      className="mt-4 w-full py-2 rounded-lg text-xs font-semibold text-center border border-black/10 dark:border-white/10 hover:border-[#B89047]/40 hover:bg-[#B89047]/10 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                    >
                      Update Operational Status
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Tariff Matrix */}
            <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Live Court Tariff Matrix per Membership Tier
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Configure hourly court reservation rates by sport discipline and membership package.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Sport</th>
                      <th className="py-3 px-3">Membership Tier</th>
                      <th className="py-3 px-3">Hourly Rate</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {courtRates.map((rate) => (
                      <tr key={rate.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-3 px-3 font-semibold text-[#1D1D1F] dark:text-white">
                          {rate.sport_name}
                        </td>
                        <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                          {rate.plan_name ? (
                            <span className="font-medium text-[#B89047]">{rate.plan_name}</span>
                          ) : (
                            <span className="text-gray-400">Standard / Non-member</span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-bold text-sm text-[#1D1D1F] dark:text-white font-display">
                          ₹{Number(rate.price).toLocaleString()} / hr
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={cn(
                              'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold',
                              rate.is_active
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-red-500/15 text-red-500'
                            )}
                          >
                            {rate.is_active ? 'Active Tariff' : 'Archived'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedRateForEdit(rate);
                              setEditRatePrice(rate.price);
                              setEditRateActive(rate.is_active);
                            }}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#B89047] bg-[#B89047]/10 hover:bg-[#B89047]/20 border border-[#B89047]/30 transition-colors cursor-pointer"
                          >
                            Adjust Rate
                          </button>
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
            TAB 3: MANAGER OVERRIDES & VOIDS
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'overrides' && (
          <div className="space-y-8">
            {/* Action 1: VIP Force Reservation */}
            <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/30 mb-2">
                    <ShieldAlert size={12} />
                    <span>Manager Authority Override</span>
                  </div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    VIP Force Court Reservation (Conflict Bypass)
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-2xl">
                    Force an immediate court reservation for dignitaries, club patron VIPs, or tournament emergencies.
                    Bypasses automatic clash checks and logs executive justification into the audit journal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForceBookingModalOpen(true)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-amber-600 hover:opacity-90 shadow-md flex items-center gap-2 cursor-pointer flex-shrink-0"
                >
                  <ShieldAlert size={14} />
                  <span>Execute VIP Override</span>
                </button>
              </div>
            </div>

            {/* Action 2: Invoice Management & Void Authority */}
            <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Invoice Corrections & Void Ledger
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Review issued billing invoices, resolve duplicate charges, and issue manager fee waivers.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search invoice or name..."
                      value={invoiceSearch}
                      onChange={(e) => setInvoiceSearch(e.target.value)}
                      className="px-3 py-1.5 pl-8 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs text-[#1D1D1F] dark:text-white outline-none"
                    />
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>

                  <select
                    value={invoiceFilterStatus}
                    onChange={(e) => setInvoiceFilterStatus(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs text-[#1D1D1F] dark:text-white outline-none"
                  >
                    <option value="all">All Statuses</option>
                    <option value="unpaid">Unpaid</option>
                    <option value="paid">Paid</option>
                    <option value="voided">Voided</option>
                  </select>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-black/10 dark:border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                      <th className="py-3 px-3">Invoice No</th>
                      <th className="py-3 px-3">Billed To</th>
                      <th className="py-3 px-3">Total Amount</th>
                      <th className="py-3 px-3">Paid</th>
                      <th className="py-3 px-3">Balance</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3 text-right">Override Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {filteredInvoices.length > 0 ? (
                      filteredInvoices.map((inv) => (
                        <tr key={inv.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                          <td className="py-3 px-3 font-semibold text-[#1D1D1F] dark:text-white">
                            {inv.invoice_no}
                          </td>
                          <td className="py-3 px-3 text-gray-700 dark:text-gray-300">
                            {inv.bill_to_name || inv.member_name || 'Guest'}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#1D1D1F] dark:text-white font-display">
                            ₹{Number(inv.total_amount).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-emerald-500 font-medium">
                            ₹{Number(inv.amount_paid).toLocaleString()}
                          </td>
                          <td className="py-3 px-3 text-amber-500 font-medium">
                            ₹{Number(inv.balance_due).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize',
                                inv.status === 'paid'
                                  ? 'bg-emerald-500/15 text-emerald-500'
                                  : inv.status === 'unpaid'
                                  ? 'bg-amber-500/15 text-amber-500'
                                  : inv.status === 'voided'
                                  ? 'bg-red-500/15 text-red-500'
                                  : 'bg-blue-500/15 text-blue-500'
                              )}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-400">
                            {new Date(inv.issue_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {inv.status !== 'voided' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedInvoiceForVoid(inv);
                                  setVoidReason('');
                                }}
                                className="px-3 py-1 rounded-lg text-xs font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors cursor-pointer"
                              >
                                Void Invoice
                              </button>
                            ) : (
                              <span
                                className="text-[10px] text-gray-400 italic"
                                title={`Reason: ${inv.void_reason || 'N/A'}`}
                              >
                                Voided ({inv.void_reason?.slice(0, 15) || 'Disputed'}...)
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-gray-400 italic">
                          No matching invoices found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 4: INVENTORY & BAR MENU CONTROL
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'inventory' && (
          <div className="space-y-8">
            {/* Sub-tab selection */}
            <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setInventorySubTab('proshop')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer',
                  inventorySubTab === 'proshop'
                    ? 'bg-[#B89047] text-white'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                )}
              >
                Pro Shop Inventory
              </button>
              <button
                type="button"
                onClick={() => setInventorySubTab('bar')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer',
                  inventorySubTab === 'bar'
                    ? 'bg-[#B89047] text-white'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                )}
              >
                Cafe & Bar Menu
              </button>
              <button
                type="button"
                onClick={() => setInventorySubTab('movements')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer',
                  inventorySubTab === 'movements'
                    ? 'bg-[#B89047] text-white'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                )}
              >
                Stock Movements Audit
              </button>
            </div>

            {/* Sub-tab 1: Pro Shop Stock */}
            {inventorySubTab === 'proshop' && (
              <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                      Pro Shop Stock On-Hand & Reorder Levels
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Monitor retail stock counts, identify low-stock warnings, and record restocks or write-offs.
                    </p>
                  </div>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search product or SKU..."
                      value={inventorySearch}
                      onChange={(e) => setInventorySearch(e.target.value)}
                      className="px-3 py-1.5 pl-8 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-xs text-[#1D1D1F] dark:text-white outline-none"
                    />
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/10 dark:border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-3">SKU</th>
                        <th className="py-3 px-3">Product Name</th>
                        <th className="py-3 px-3">Variant / Spec</th>
                        <th className="py-3 px-3">Price</th>
                        <th className="py-3 px-3">On Hand</th>
                        <th className="py-3 px-3">Reorder Point</th>
                        <th className="py-3 px-3">Health</th>
                        <th className="py-3 px-3 text-right">Adjustment</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {filteredInventoryItems.map((item) => {
                        const isLowStock = item.stock_on_hand <= item.reorder_level;
                        return (
                          <tr key={item.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                            <td className="py-3 px-3 font-mono font-semibold text-[#1D1D1F] dark:text-white">
                              {item.sku}
                            </td>
                            <td className="py-3 px-3 font-semibold text-gray-800 dark:text-gray-200">
                              {item.product_name}
                              {item.brand && (
                                <span className="text-[10px] text-gray-400 block font-normal">
                                  {item.brand}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-gray-500">
                              {item.size || item.color ? `${item.size || ''} ${item.color || ''}` : 'Standard'}
                            </td>
                            <td className="py-3 px-3 font-bold text-[#1D1D1F] dark:text-white font-display">
                              ₹{Number(item.price_override || item.base_price).toLocaleString()}
                            </td>
                            <td className="py-3 px-3 font-bold text-sm text-[#1D1D1F] dark:text-white">
                              {item.stock_on_hand}
                            </td>
                            <td className="py-3 px-3 text-gray-400">{item.reorder_level}</td>
                            <td className="py-3 px-3">
                              {isLowStock ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/15 text-red-500">
                                  <BadgeAlert size={11} />
                                  <span>Low Stock</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500">
                                  <Check size={11} />
                                  <span>Optimal</span>
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedVariantForAdjust(item);
                                  setAdjustQtyChange(0);
                                  setAdjustReason('restock');
                                  setAdjustNotes('');
                                }}
                                className="px-3 py-1 rounded-lg text-xs font-semibold text-[#B89047] bg-[#B89047]/10 hover:bg-[#B89047]/20 border border-[#B89047]/30 transition-colors cursor-pointer"
                              >
                                Adjust Units
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab 2: Cafe & Bar Menu */}
            {inventorySubTab === 'bar' && (
              <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                      Champions Cafe & Sports Lounge Menu Control
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Toggle drink and snack availability in real-time, adjust prices, and manage active offerings.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {barItems.map((bar) => (
                    <div
                      key={bar.id}
                      className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#B89047]">
                            {bar.category_name || 'Refreshment'}
                          </span>
                          <span
                            className={cn(
                              'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
                              bar.is_available
                                ? 'bg-emerald-500/15 text-emerald-500'
                                : 'bg-red-500/15 text-red-500'
                            )}
                          >
                            {bar.is_available ? 'Serving' : 'Sold Out'}
                          </span>
                        </div>
                        <h4 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white">
                          {bar.name}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                          {bar.description}
                        </p>
                        <div className="mt-3 text-lg font-bold text-[#1D1D1F] dark:text-white font-display">
                          ₹{Number(bar.price).toLocaleString()}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBarItemForEdit(bar);
                          setEditBarPrice(bar.price);
                          setEditBarAvailable(bar.is_available);
                        }}
                        className="mt-4 w-full py-2 rounded-lg text-xs font-semibold text-center border border-black/10 dark:border-white/10 hover:border-[#B89047]/40 hover:bg-[#B89047]/10 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                      >
                        Edit Price / Availability
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-tab 3: Stock Movements Audit */}
            {inventorySubTab === 'movements' && (
              <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                      Stock Movements Audit Trail
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Immutable record of all inventory reconciliations, write-offs, and restock batches.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/10 dark:border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-3">Timestamp</th>
                        <th className="py-3 px-3">SKU</th>
                        <th className="py-3 px-3">Item Name</th>
                        <th className="py-3 px-3">Qty Change</th>
                        <th className="py-3 px-3">Balance After</th>
                        <th className="py-3 px-3">Reason</th>
                        <th className="py-3 px-3">Performed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {stockMovements.map((mov) => (
                        <tr key={mov.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                          <td className="py-3 px-3 text-gray-400">
                            {new Date(mov.created_at).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-[#1D1D1F] dark:text-white">
                            {mov.sku}
                          </td>
                          <td className="py-3 px-3 font-semibold text-gray-800 dark:text-gray-200">
                            {mov.product_name}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                'font-bold font-mono',
                                mov.quantity_change > 0 ? 'text-emerald-500' : 'text-red-500'
                              )}
                            >
                              {mov.quantity_change > 0 ? `+${mov.quantity_change}` : mov.quantity_change}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-bold text-[#1D1D1F] dark:text-white">
                            {mov.balance_after}
                          </td>
                          <td className="py-3 px-3 capitalize text-gray-600 dark:text-gray-300">
                            {mov.reason} {mov.notes ? `(${mov.notes})` : ''}
                          </td>
                          <td className="py-3 px-3 text-gray-600 dark:text-gray-300">
                            {mov.performed_by_name || 'System / Auto'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TAB 5: STAFF & SHIFTS (HR)
            ══════════════════════════════════════════════════════════════ */}
        {activeTab === 'hr' && (
          <div className="space-y-8">
            {/* Sub-tab selection */}
            <div className="flex items-center gap-2 border-b border-black/10 dark:border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setHrSubTab('employees')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer',
                  hrSubTab === 'employees'
                    ? 'bg-[#B89047] text-white'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                )}
              >
                Staff Directory
              </button>
              <button
                type="button"
                onClick={() => setHrSubTab('shifts')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer',
                  hrSubTab === 'shifts'
                    ? 'bg-[#B89047] text-white'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                )}
              >
                Shift Scheduling
              </button>
              <button
                type="button"
                onClick={() => setHrSubTab('leaves')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer',
                  hrSubTab === 'leaves'
                    ? 'bg-[#B89047] text-white'
                    : 'text-gray-500 hover:text-black dark:hover:text-white'
                )}
              >
                Leave Requests & Approvals
              </button>
            </div>

            {/* Sub-tab 1: Staff Directory */}
            {hrSubTab === 'employees' && (
              <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                      Club Staff & Coaching Personnel Directory
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Overview of active receptionists, head coaches, pro-shop managers, and facilities staff.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="p-4 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.02]"
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-bold text-[#B89047]">
                          {emp.employee_code}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-bold px-2 py-0.5 rounded capitalize',
                            emp.status === 'active'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : 'bg-gray-500/15 text-gray-400'
                          )}
                        >
                          {emp.status}
                        </span>
                      </div>
                      <h4 className="font-display text-base font-bold text-[#1D1D1F] dark:text-white">
                        {emp.full_name}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">
                        {emp.job_title} • {emp.department}
                      </p>
                      <div className="mt-3 pt-3 border-t border-black/5 dark:border-white/5 text-[11px] text-gray-500 space-y-1">
                        <div>Email: {emp.user_email || emp.email || 'N/A'}</div>
                        <div>Phone: {emp.user_phone || emp.phone || 'N/A'}</div>
                        <div>Employment: <span className="capitalize">{emp.employment_type}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sub-tab 2: Shift Scheduling */}
            {hrSubTab === 'shifts' && (
              <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                      Roster & Shift Schedules
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Assign working shifts for front desk teams, pro-shop attendants, and court stewards.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCreateShiftModalOpen(true)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] hover:opacity-90 shadow-md border border-[#B89047]/30 flex items-center gap-2 cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Assign Staff Shift</span>
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/10 dark:border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-3">Employee</th>
                        <th className="py-3 px-3">Department</th>
                        <th className="py-3 px-3">Shift Start</th>
                        <th className="py-3 px-3">Shift End</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {shifts.map((shift) => (
                        <tr key={shift.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                          <td className="py-3 px-3 font-semibold text-[#1D1D1F] dark:text-white">
                            {shift.employee_name}
                            <span className="text-[10px] text-gray-400 block font-normal">
                              {shift.employee_code} • {shift.job_title}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-600 dark:text-gray-300">{shift.department}</td>
                          <td className="py-3 px-3 font-medium text-[#1D1D1F] dark:text-white">
                            {new Date(shift.starts_at).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-3 px-3 font-medium text-[#1D1D1F] dark:text-white">
                            {new Date(shift.ends_at).toLocaleString([], {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize',
                                shift.status === 'scheduled'
                                  ? 'bg-blue-500/15 text-blue-500'
                                  : shift.status === 'completed'
                                  ? 'bg-emerald-500/15 text-emerald-500'
                                  : 'bg-gray-500/15 text-gray-400'
                              )}
                            >
                              {shift.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-gray-400">{shift.notes || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-tab 3: Leave Requests & Decisions */}
            {hrSubTab === 'leaves' && (
              <div className="rounded-2xl p-6 border border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0E0E12] backdrop-blur-xl shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                      Staff Leave Requests & Management Approvals
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      Review vacation, emergency, or medical leave requests submitted by staff members.
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-black/10 dark:border-white/10 text-gray-400 uppercase tracking-wider font-semibold">
                        <th className="py-3 px-3">Staff Member</th>
                        <th className="py-3 px-3">Leave Type</th>
                        <th className="py-3 px-3">Duration</th>
                        <th className="py-3 px-3">Days</th>
                        <th className="py-3 px-3">Reason</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Decision</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {leaves.map((leave) => (
                        <tr key={leave.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                          <td className="py-3 px-3 font-semibold text-[#1D1D1F] dark:text-white">
                            {leave.employee_name}
                            <span className="text-[10px] text-gray-400 block font-normal">
                              {leave.employee_code} • {leave.department}
                            </span>
                          </td>
                          <td className="py-3 px-3 font-medium text-gray-700 dark:text-gray-200">
                            {leave.leave_type_name}
                          </td>
                          <td className="py-3 px-3 text-gray-500">
                            {new Date(leave.start_date).toLocaleDateString()} —{' '}
                            {new Date(leave.end_date).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 font-bold text-[#1D1D1F] dark:text-white">
                            {leave.days_requested} d
                          </td>
                          <td className="py-3 px-3 text-gray-600 dark:text-gray-300 max-w-xs truncate">
                            {leave.reason}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={cn(
                                'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold capitalize',
                                leave.status === 'approved'
                                  ? 'bg-emerald-500/15 text-emerald-500'
                                  : leave.status === 'rejected'
                                  ? 'bg-red-500/15 text-red-500'
                                  : 'bg-amber-500/15 text-amber-500'
                              )}
                            >
                              {leave.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            {leave.status === 'pending' ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => setSelectedLeaveForDecision({ leave, action: 'approved' })}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors cursor-pointer"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedLeaveForDecision({ leave, action: 'rejected' })}
                                  className="px-2.5 py-1 rounded-lg text-xs font-semibold text-red-500 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 transition-colors cursor-pointer"
                                >
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-gray-400 italic">
                                {leave.decision_note ? `Note: ${leave.decision_note}` : 'Reviewed'}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODAL 1: DAY-END REGISTER CLOSING
            ══════════════════════════════════════════════════════════════ */}
        {isClosingModalOpen && dailySummary && createPortal(
          <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Execute Day-End Register Closing
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Business Date: <strong>{selectedDate}</strong>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsClosingModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handlePerformClosing} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Closing Department
                  </label>
                  <input
                    type="text"
                    value={closingDepartment}
                    onChange={(e) => setClosingDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Total Revenue</span>
                    <p className="text-sm font-bold text-[#1D1D1F] dark:text-white font-display mt-0.5">
                      ₹{Number(dailySummary.total_revenue).toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold">Expected Cash</span>
                    <p className="text-sm font-bold text-emerald-500 font-display mt-0.5">
                      ₹
                      {(
                        closingOpeningCash +
                        Number(
                          dailySummary.payment_breakdown.find((p) => p.payment_method?.toLowerCase() === 'cash')
                            ?.total || 0
                        )
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Opening Drawer Float (₹)
                    </label>
                    <input
                      type="number"
                      value={closingOpeningCash}
                      onChange={(e) => setClosingOpeningCash(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Counted Cash in Drawer (₹)
                    </label>
                    <input
                      type="number"
                      value={closingCountedCash}
                      onChange={(e) => setClosingCountedCash(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none font-bold"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Manager Closing Notes / Variance Explanation
                  </label>
                  <textarea
                    rows={2}
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                    placeholder="e.g. Cash perfectly tallied with POS system. Deposited in safe."
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsClosingModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingClosing}
                    className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingClosing ? 'Closing Register...' : 'Confirm & Archive Register'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODAL 2: UPDATE COURT OPERATIONAL STATUS
            ══════════════════════════════════════════════════════════════ */}
        {selectedCourtForEdit && createPortal(
          <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Update Court Status
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedCourtForEdit.name} ({selectedCourtForEdit.sport_name})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedCourtForEdit(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCourtStatus} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Operational Status
                  </label>
                  <select
                    value={editCourtStatus}
                    onChange={(e) => setEditCourtStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none capitalize"
                  >
                    <option value="available">Available (Open for Play)</option>
                    <option value="maintenance">Maintenance (Surface Resurfacing / Nets)</option>
                    <option value="blocked">Blocked (Reserved for Private Event)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Manager Note / Block Reason
                  </label>
                  <input
                    type="text"
                    value={editCourtNotes}
                    onChange={(e) => setEditCourtNotes(e.target.value)}
                    placeholder="e.g. Floodlight inspection until 4 PM"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedCourtForEdit(null)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingCourtEdit}
                    className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingCourtEdit ? 'Saving...' : 'Save Court Status'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODAL 3: ADJUST COURT TARIFF
            ══════════════════════════════════════════════════════════════ */}
        {selectedRateForEdit && createPortal(
          <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Adjust Court Tariff
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedRateForEdit.sport_name} — {selectedRateForEdit.plan_name || 'Standard Tier'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedRateForEdit(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCourtRate} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Hourly Price (₹)
                  </label>
                  <input
                    type="number"
                    step="50"
                    value={editRatePrice}
                    onChange={(e) => setEditRatePrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Tariff Status
                  </label>
                  <select
                    value={editRateActive}
                    onChange={(e) => setEditRateActive(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                  >
                    <option value={1}>Active</option>
                    <option value={0}>Disabled / Archived</option>
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedRateForEdit(null)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingRateEdit}
                    className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingRateEdit ? 'Updating...' : 'Update Tariff'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODAL 4: VIP FORCE COURT BOOKING
            ══════════════════════════════════════════════════════════════ */}
        {isForceBookingModalOpen && createPortal(
          <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                    <ShieldAlert size={18} />
                    <span>VIP Force Reservation Override</span>
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Authorized for General Manager only. Bypasses court schedule locks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsForceBookingModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleForceBooking} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Target Court Arena *
                  </label>
                  <select
                    value={forceCourtId}
                    onChange={(e) => setForceCourtId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                    required
                  >
                    <option value="">Select Court</option>
                    {courts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.sport_name}) — Currently {c.status}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Start Datetime *
                    </label>
                    <input
                      type="datetime-local"
                      value={forceStartsAt}
                      onChange={(e) => setForceStartsAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      End Datetime *
                    </label>
                    <input
                      type="datetime-local"
                      value={forceEndsAt}
                      onChange={(e) => setForceEndsAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Reservation Nature
                  </label>
                  <select
                    value={forceReservationType}
                    onChange={(e) => setForceReservationType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                  >
                    <option value="exclusive">Exclusive VIP Private Session</option>
                    <option value="social">VIP Exhibition / Tournament</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-red-600 dark:text-red-400 mb-1">
                    Mandatory Manager Audit Reason *
                  </label>
                  <textarea
                    rows={2}
                    value={forceNotes}
                    onChange={(e) => setForceNotes(e.target.value)}
                    placeholder="e.g. Board Member emergency reservation; authorized by GM Sunita Rao."
                    className="w-full px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/5 text-[#1D1D1F] dark:text-white outline-none resize-none"
                    required
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsForceBookingModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingForceBooking}
                    className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-red-600 to-amber-600 shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingForceBooking ? 'Executing...' : 'Force VIP Reservation'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODAL 5: VOID INVOICE
            ══════════════════════════════════════════════════════════════ */}
        {selectedInvoiceForVoid && createPortal(
          <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-red-600 dark:text-red-400">
                    Void Invoice #{selectedInvoiceForVoid.invoice_no}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Amount: ₹{Number(selectedInvoiceForVoid.total_amount).toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedInvoiceForVoid(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleVoidInvoice} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Mandatory Void Reason *
                  </label>
                  <textarea
                    rows={3}
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="e.g. Duplicate front desk billing entry / Manager approved waiver"
                    className="w-full px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/5 text-[#1D1D1F] dark:text-white outline-none resize-none"
                    required
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoiceForVoid(null)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingVoid}
                    className="px-5 py-2 rounded-xl font-semibold text-white bg-red-600 hover:bg-red-700 shadow-md transition-colors cursor-pointer"
                  >
                    {isSubmittingVoid ? 'Voiding...' : 'Confirm Invoice Void'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODAL 6: ADJUST INVENTORY STOCK
            ══════════════════════════════════════════════════════════════ */}
        {selectedVariantForAdjust && createPortal(
          <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Stock Adjustment
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedVariantForAdjust.product_name} ({selectedVariantForAdjust.sku})
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedVariantForAdjust(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAdjustStock} className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] flex items-center justify-between">
                  <span className="text-gray-500">Current Stock On-Hand:</span>
                  <span className="font-bold text-base text-[#1D1D1F] dark:text-white">
                    {selectedVariantForAdjust.stock_on_hand} units
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Units to Add (+) or Deduct (-) *
                  </label>
                  <input
                    type="number"
                    value={adjustQtyChange}
                    onChange={(e) => setAdjustQtyChange(Number(e.target.value))}
                    placeholder="+20 for restock, -2 for damage"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none font-bold"
                    required
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    Resulting Stock: {selectedVariantForAdjust.stock_on_hand + adjustQtyChange} units
                  </span>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Adjustment Reason
                  </label>
                  <select
                    value={adjustReason}
                    onChange={(e) => setAdjustReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none capitalize"
                  >
                    <option value="restock">Restock / Supplier Delivery (+)</option>
                    <option value="reconciliation">Inventory Reconciliation (+ / -)</option>
                    <option value="damage">Damaged Goods (-)</option>
                    <option value="return">Customer Return (+)</option>
                    <option value="theft">Lost / Missing (-)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Manager Notes
                  </label>
                  <input
                    type="text"
                    value={adjustNotes}
                    onChange={(e) => setAdjustNotes(e.target.value)}
                    placeholder="e.g. Invoice PO-8834 arrived"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedVariantForAdjust(null)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingAdjust}
                    className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingAdjust ? 'Adjusting...' : 'Commit Stock Change'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODAL 7: EDIT BAR ITEM
            ══════════════════════════════════════════════════════════════ */}
        {selectedBarItemForEdit && createPortal(
          <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Edit Cafe & Bar Offering
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedBarItemForEdit.name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedBarItemForEdit(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveBarItem} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Price (₹) *
                  </label>
                  <input
                    type="number"
                    value={editBarPrice}
                    onChange={(e) => setEditBarPrice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none font-bold"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Kitchen Availability
                  </label>
                  <select
                    value={editBarAvailable}
                    onChange={(e) => setEditBarAvailable(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                  >
                    <option value={1}>Available / Serving</option>
                    <option value={0}>Sold Out / Temporarily Unavailable</option>
                  </select>
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedBarItemForEdit(null)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingBarEdit}
                    className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingBarEdit ? 'Saving...' : 'Save Offering'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODAL 8: ASSIGN STAFF SHIFT
            ══════════════════════════════════════════════════════════════ */}
        {isCreateShiftModalOpen && createPortal(
          <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white">
                    Assign Staff Shift
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Schedule working hours for club personnel
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCreateShiftModalOpen(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateShift} className="space-y-4 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Staff Member *
                  </label>
                  <select
                    value={shiftEmployeeId}
                    onChange={(e) => setShiftEmployeeId(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.full_name} ({e.employee_code}) — {e.job_title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Assigned Department
                  </label>
                  <input
                    type="text"
                    value={shiftDepartment}
                    onChange={(e) => setShiftDepartment(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Starts At *
                    </label>
                    <input
                      type="datetime-local"
                      value={shiftStartsAt}
                      onChange={(e) => setShiftStartsAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Ends At *
                    </label>
                    <input
                      type="datetime-local"
                      value={shiftEndsAt}
                      onChange={(e) => setShiftEndsAt(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Shift Notes
                  </label>
                  <input
                    type="text"
                    value={shiftNotes}
                    onChange={(e) => setShiftNotes(e.target.value)}
                    placeholder="e.g. Morning check-in rush coverage"
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setIsCreateShiftModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingShift}
                    className="px-5 py-2 rounded-xl font-semibold text-white bg-gradient-to-r from-[#141416] via-[#24242A] to-[#141416] dark:from-[#B89047] dark:via-[#A67C38] dark:to-[#8C6826] shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmittingShift ? 'Assigning...' : 'Assign Shift'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* ══════════════════════════════════════════════════════════════
            MODAL 9: LEAVE DECISION
            ══════════════════════════════════════════════════════════════ */}
        {selectedLeaveForDecision && createPortal(
          <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-md rounded-3xl p-6 sm:p-8 border border-black/10 dark:border-white/10 bg-white dark:bg-[#0E0E12] shadow-2xl">
              <div className="flex items-center justify-between pb-4 border-b border-black/10 dark:border-white/10 mb-5">
                <div>
                  <h3 className="font-display text-lg font-bold text-[#1D1D1F] dark:text-white capitalize">
                    {selectedLeaveForDecision.action} Leave Request
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedLeaveForDecision.leave.employee_name} (
                    {selectedLeaveForDecision.leave.days_requested} days requested)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedLeaveForDecision(null)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleLeaveDecision} className="space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] space-y-1">
                  <div>Reason: {selectedLeaveForDecision.leave.reason}</div>
                  <div>
                    Dates: {new Date(selectedLeaveForDecision.leave.start_date).toLocaleDateString()} —{' '}
                    {new Date(selectedLeaveForDecision.leave.end_date).toLocaleDateString()}
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Decision Note (Optional)
                  </label>
                  <textarea
                    rows={2}
                    value={decisionNote}
                    onChange={(e) => setDecisionNote(e.target.value)}
                    placeholder="e.g. Approved. Please ensure shift coverage is handed over."
                    className="w-full px-3 py-2 rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white outline-none resize-none"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2 border-t border-black/10 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setSelectedLeaveForDecision(null)}
                    className="px-4 py-2 rounded-xl text-gray-500 hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingLeaveDecision}
                    className={cn(
                      'px-5 py-2 rounded-xl font-semibold text-white shadow-md hover:opacity-90 disabled:opacity-50 cursor-pointer',
                      selectedLeaveForDecision.action === 'approved'
                        ? 'bg-emerald-600'
                        : 'bg-red-600'
                    )}
                  >
                    {isSubmittingLeaveDecision
                      ? 'Processing...'
                      : `Confirm ${selectedLeaveForDecision.action}`}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
      </div>
    </PageLayout>
  );
};

export default ManagerPage;
