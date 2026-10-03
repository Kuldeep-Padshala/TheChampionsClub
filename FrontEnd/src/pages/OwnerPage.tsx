import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Crown,
  DollarSign,
  TrendingUp,
  Activity,
  Award,
  CheckSquare,
  CheckCircle2,
  Sliders,
  Share2,
  Plus,
  RefreshCw,
  Check,
  Copy,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { ownerService } from '../services/ownerService';
import {
  RevenueAnalytics,
  CourtOccupancy,
  GrowthAnalytics,
  PendingApprovalsData,
  OwnerMembershipPlan,
  ReportShareItem
} from '../types/owner.types';
import { cn } from '../utils/cn';

export const OwnerPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // State
  const [revenueTimeframe, setRevenueTimeframe] = useState<'day' | 'week' | 'month' | 'year'>('month');
  const [revenueAnalytics, setRevenueAnalytics] = useState<RevenueAnalytics | null>(null);
  const [occupancy, setOccupancy] = useState<CourtOccupancy[]>([]);
  const [growth, setGrowth] = useState<GrowthAnalytics | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<PendingApprovalsData>({ payrolls: [], expenses: [] });
  const [membershipPlans, setMembershipPlans] = useState<OwnerMembershipPlan[]>([]);
  const [reportShares, setReportShares] = useState<ReportShareItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Global Discount State
  const [shopDiscountVal, setShopDiscountVal] = useState(15);
  const [barDiscountVal, setBarDiscountVal] = useState(10);
  const [isSavingDiscount, setIsSavingDiscount] = useState(false);

  // Add Plan Modal State
  const [isAddPlanOpen, setIsAddPlanOpen] = useState(false);
  const [planForm, setPlanForm] = useState({
    code: '',
    name: '',
    description: '',
    duration_months: 12,
    fee: 4999,
    joining_fee: 999,
    shop_discount_pct: 10,
    bar_discount_pct: 10,
    benefits: 'Priority court reservations\nPro shop 10% discount\nCafe & bar 10% discount\nFull locker room access'
  });
  const [isSubmittingPlan, setIsSubmittingPlan] = useState(false);

  // Report Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareReportType, setShareReportType] = useState('monthly_summary');
  const [shareRecipientName, setShareRecipientName] = useState('');
  const [shareRecipientEmail, setShareRecipientEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isGeneratingShare, setIsGeneratingShare] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  // Load All Owner Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        revData,
        occData,
        growthData,
        approvalsData,
        plansData,
        sharesData
      ] = await Promise.all([
        ownerService.getRevenueAnalytics(revenueTimeframe).catch(() => null),
        ownerService.getOccupancyAnalytics().catch(() => []),
        ownerService.getGrowthAnalytics().catch(() => null),
        ownerService.getPendingApprovals().catch(() => ({ payrolls: [], expenses: [] })),
        ownerService.getMembershipPlans().catch(() => []),
        ownerService.getReportShares().catch(() => [])
      ]);

      if (revData) setRevenueAnalytics(revData);
      setOccupancy(occData);
      if (growthData) setGrowth(growthData);
      setPendingApprovals(approvalsData);
      setMembershipPlans(plansData);
      setReportShares(sharesData);
    } catch (err) {
      console.error('Failed to load owner data', err);
      toast.error('Failed to load owner telemetry');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    ownerService.getRevenueAnalytics(revenueTimeframe)
      .then(data => setRevenueAnalytics(data))
      .catch(() => {});
  }, [revenueTimeframe]);

  // Authorize Payroll Run
  const handleAuthorizePayroll = async (id: number) => {
    try {
      const res = await ownerService.authorizePayroll(id);
      toast.success(res.message);
      setPendingApprovals(prev => ({
        ...prev,
        payrolls: prev.payrolls.filter(p => p.id !== id)
      }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to authorize payroll');
    }
  };

  // Authorize Expense
  const handleAuthorizeExpense = async (id: number) => {
    try {
      const res = await ownerService.authorizeExpense(id, { payment_method: 'bank_transfer' });
      toast.success(res.message);
      setPendingApprovals(prev => ({
        ...prev,
        expenses: prev.expenses.filter(e => e.id !== id)
      }));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to authorize expense');
    }
  };

  // Create Plan Strategy
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planForm.name || !planForm.fee) return;

    setIsSubmittingPlan(true);
    try {
      const benefitList = planForm.benefits
        .split('\n')
        .map(b => b.trim())
        .filter(Boolean);

      const res = await ownerService.createMembershipPlan({
        code: planForm.code || planForm.name.toUpperCase().replace(/[^A-Z0-9]/g, '_'),
        name: planForm.name.trim(),
        description: planForm.description.trim(),
        duration_months: Number(planForm.duration_months),
        fee: Number(planForm.fee),
        joining_fee: Number(planForm.joining_fee),
        shop_discount_pct: Number(planForm.shop_discount_pct),
        bar_discount_pct: Number(planForm.bar_discount_pct),
        benefits: benefitList
      });

      toast.success(res.message);
      setIsAddPlanOpen(false);
      setPlanForm({
        code: '',
        name: '',
        description: '',
        duration_months: 12,
        fee: 4999,
        joining_fee: 999,
        shop_discount_pct: 10,
        bar_discount_pct: 10,
        benefits: ''
      });
      const updatedPlans = await ownerService.getMembershipPlans();
      setMembershipPlans(updatedPlans);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to deploy membership plan');
    } finally {
      setIsSubmittingPlan(false);
    }
  };

  // Save Discount Strategy
  const handleSaveDiscount = async (target: 'SHOP' | 'BAR', value: number) => {
    setIsSavingDiscount(true);
    try {
      const res = await ownerService.manageDiscounts(target, value);
      toast.success(res.message);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update discount strategy');
    } finally {
      setIsSavingDiscount(false);
    }
  };

  // Generate Report Share Link
  const handleGenerateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGeneratingShare(true);
    try {
      const res = await ownerService.generateReportShare({
        report_type: shareReportType,
        recipient_name: shareRecipientName || 'Board of Governors',
        recipient_email: shareRecipientEmail || undefined
      });
      toast.success(res.message);
      setGeneratedLink(res.secure_link);
      const updatedShares = await ownerService.getReportShares();
      setReportShares(updatedShares);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to generate report link');
    } finally {
      setIsGeneratingShare(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0D] text-[#FAF8F5] pt-24 pb-16 px-3 sm:px-6 lg:px-8 font-sans selection:bg-[#B89047]/30">
      {/* ── Top Header / Station Badge ────────────────────────────── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#14141A] via-[#1A1A24] to-[#121216] border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#B89047]/10 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EAD29A] via-[#B89047] to-[#7D5A1E] p-[2px] shadow-lg shadow-[#B89047]/20 flex-shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#0D0D12] flex items-center justify-center">
                <Crown className="w-7 h-7 text-[#EAD29A]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#B89047]/20 text-[#EAD29A] border border-[#B89047]/30 shadow-[0_0_10px_rgba(234,210,154,0.15)]">
                  👑 Club Owner
                </span>
                <span className="text-xs text-white/50 flex items-center gap-1">
                  Full Club Ownership & Executive Strategy
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-white mt-1">
                Executive Owner & Strategy Suite
              </h1>
              <p className="text-xs sm:text-sm text-white/60">
                Owner: <strong className="text-white">{user?.name || 'Rajesh Malhotra'}</strong> • Executive Health, Financial Approvals, Strategy & Investor Briefings
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white/80 bg-white/5 hover:bg-white/10 border border-white/10 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw size={14} className={cn(isLoading && 'animate-spin')} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>

        {/* ── KPI Metric Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider block">
              Total Gross Revenue
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-white">
                ₹{(revenueAnalytics?.total_revenue || 125567).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
                <TrendingUp size={11} /> +14.2%
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider block">
              Pending Approvals
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-amber-400">
                {pendingApprovals.payrolls.length + pendingApprovals.expenses.length}
              </span>
              <span className="text-xs text-white/50">
                {pendingApprovals.payrolls.length} Payroll • {pendingApprovals.expenses.length} Expenses
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider block">
              Active VIP Members
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-white">
                {growth?.active_members ?? 32}
              </span>
              <span className="text-xs text-emerald-400">
                +{growth?.net_growth ?? 29} this month
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10">
            <span className="text-[11px] font-medium text-white/50 uppercase tracking-wider block">
              Investor Reports
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-[#EAD29A]">
                {reportShares.length}
              </span>
              <span className="text-xs text-white/50">Active Links</span>
            </div>
          </div>
        </div>

        {/* ── Sub Navigation Tabs ──────────────────────────────────── */}
        <div className="flex items-center gap-2 mt-6 p-1.5 rounded-2xl bg-white/[0.04] border border-white/10 overflow-x-auto select-none">
          {[
            { id: 'overview',   label: 'Executive KPIs',     icon: Activity },
            { id: 'approvals',  label: 'Financial Approvals', icon: CheckSquare, badge: pendingApprovals.payrolls.length + pendingApprovals.expenses.length },
            { id: 'strategy',   label: 'Strategy & Plans',   icon: Sliders },
            { id: 'investors',  label: 'Investor Reports',   icon: Share2 },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTab(tab.id)}
                className={cn(
                  'px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap leading-none flex-shrink-0',
                  isActive
                    ? 'bg-gradient-to-r from-[#B89047] to-[#8C6826] text-white shadow-md shadow-[#B89047]/20 font-bold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                )}
              >
                <Icon size={15} className="flex-shrink-0" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-extrabold',
                    isActive ? 'bg-black/40 text-amber-200' : 'bg-amber-500/20 text-amber-400'
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Content Area ─────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ══════════════════════════════════════════════════════════
            TAB 1: EXECUTIVE KPIS
            ══════════════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Revenue Analytics Card */}
            <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#EAD29A]" />
                    Revenue Architecture & Department Breakdown
                  </h3>
                  <p className="text-xs text-white/50">
                    Live gross receipts from Invoices, Memberships, Cafe orders, and Pro Shop counter POS
                  </p>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
                  {(['day', 'week', 'month', 'year'] as const).map(tf => (
                    <button
                      key={tf}
                      onClick={() => setRevenueTimeframe(tf)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer',
                        revenueTimeframe === tf
                          ? 'bg-[#B89047] text-white shadow-sm'
                          : 'text-white/50 hover:text-white'
                      )}
                    >
                      {tf}
                    </button>
                  ))}
                </div>
              </div>

              {/* Department Revenue Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-amber-500/20">
                  <div className="flex justify-between items-center text-xs text-white/50 mb-1">
                    <span>👑 VIP Memberships</span>
                    <span className="text-amber-400 font-bold">45%</span>
                  </div>
                  <p className="text-2xl font-bold font-display text-white">
                    ₹{(revenueAnalytics?.breakdown.memberships || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[11px] text-white/40 mt-1">Tier fees & joining dues</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-blue-500/20">
                  <div className="flex justify-between items-center text-xs text-white/50 mb-1">
                    <span>🎾 Court Reservations</span>
                    <span className="text-blue-400 font-bold">25%</span>
                  </div>
                  <p className="text-2xl font-bold font-display text-white">
                    ₹{(revenueAnalytics?.breakdown.courts || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[11px] text-white/40 mt-1">Tennis, Padel & Badminton slots</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-amber-600/20">
                  <div className="flex justify-between items-center text-xs text-white/50 mb-1">
                    <span>☕ Cafe & Bar Lounge</span>
                    <span className="text-amber-500 font-bold">20%</span>
                  </div>
                  <p className="text-2xl font-bold font-display text-white">
                    ₹{(revenueAnalytics?.breakdown.bar || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[11px] text-white/40 mt-1">KDS tabs & table billing</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-purple-500/20">
                  <div className="flex justify-between items-center text-xs text-white/50 mb-1">
                    <span>🛍️ Pro Shop & Gear</span>
                    <span className="text-purple-400 font-bold">10%</span>
                  </div>
                  <p className="text-2xl font-bold font-display text-white">
                    ₹{(revenueAnalytics?.breakdown.shop || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                  <p className="text-[11px] text-white/40 mt-1">Equipment, apparel & restocks</p>
                </div>
              </div>
            </div>

            {/* Court Occupancy & Member Growth Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Court Occupancy Analytics */}
              <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <Activity className="w-4 h-4 text-emerald-400" />
                      Court Utilization & Occupancy (30 Days)
                    </h3>
                    <p className="text-xs text-white/50">Tracking reservation volume across all athletic facilities</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {occupancy.slice(0, 6).map(court => (
                    <div key={court.court_id} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{court.court_name}</span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-white/10 text-white/70">
                            {court.sport_name} • {court.surface}
                          </span>
                        </div>
                        <span className="font-mono text-[#EAD29A] font-semibold">
                          {court.total_bookings} bookings ({court.utilization_pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#B89047] to-[#EAD29A]"
                          style={{ width: `${Math.min(100, Math.max(5, parseFloat(court.utilization_pct) * 10))}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Member Growth & Net Retention */}
              <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div>
                    <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-[#EAD29A]" />
                      Member Acquisition & Net Retention
                    </h3>
                    <p className="text-xs text-white/50">30-day membership acquisition vs churn telemetry</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="text-xs text-emerald-400 font-semibold block uppercase">New Enrolments</span>
                    <span className="text-3xl font-display font-bold text-white mt-1 block">
                      +{growth?.new_members ?? 29}
                    </span>
                    <span className="text-[10px] text-emerald-300/80">Approved this cycle</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-center">
                    <span className="text-xs text-red-400 font-semibold block uppercase">Churn / Cancellations</span>
                    <span className="text-3xl font-display font-bold text-white mt-1 block">
                      {growth?.churned_members ?? 0}
                    </span>
                    <span className="text-[10px] text-red-300/80">0.0% churn rate</span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Net Member Expansion</span>
                    <span className="font-bold text-emerald-400">+{growth?.net_growth ?? 29} net growth</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Active Roster Size</span>
                    <span className="font-bold text-white">{growth?.active_members ?? 32} VIP patrons</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-white/60">Growth Rate</span>
                    <span className="font-bold text-[#EAD29A]">{growth?.growth_rate_pct ?? 90.6}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 2: FINANCIAL APPROVALS
            ══════════════════════════════════════════════════════════ */}
        {activeTab === 'approvals' && (
          <div className="space-y-6">
            {/* Pending Payroll Runs */}
            <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                    <CheckSquare className="w-5 h-5 text-[#EAD29A]" />
                    Payroll Runs Awaiting Owner Authorization
                  </h3>
                  <p className="text-xs text-white/50">
                    Draft staff payroll calculations submitted by Finance requiring Owner executive sign-off
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {pendingApprovals.payrolls.length} Pending
                </span>
              </div>

              {pendingApprovals.payrolls.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto mb-2" />
                  All staff payroll runs have been formally approved and authorized.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.payrolls.map(pr => (
                    <div key={pr.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">
                            Payroll Run #{pr.id} — Period: {new Date(pr.period_month).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-400">
                            Draft Status
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-1">
                          Prepared by: <strong className="text-white/80">{pr.prepared_by_name || 'Meera Bhatt'}</strong> • {pr.staff_count} Staff Members • Notes: {pr.notes || 'Monthly club salary cycle'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-white/40 block uppercase">Disbursement Sum</span>
                          <span className="text-lg font-bold font-mono text-emerald-400">
                            ₹{Number(pr.total_amount).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAuthorizePayroll(pr.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all cursor-pointer shadow-md"
                        >
                          Authorize Payout
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Major Expenses */}
            <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-amber-400" />
                    Major Incurred Expenses Awaiting Owner Approval
                  </h3>
                  <p className="text-xs text-white/50">
                    Vendor bills, maintenance outlays, and utility obligations requiring executive clearance
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  {pendingApprovals.expenses.length} Unpaid
                </span>
              </div>

              {pendingApprovals.expenses.length === 0 ? (
                <div className="text-center py-8 text-white/40 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400/50 mx-auto mb-2" />
                  No pending vendor or facility expenses requiring approval.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingApprovals.expenses.map(exp => (
                    <div key={exp.id} className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{exp.description}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white/80">
                            {exp.category_name || 'Operating Expense'}
                          </span>
                        </div>
                        <p className="text-xs text-white/50 mt-1">
                          Vendor: <strong className="text-white/80">{exp.vendor_name || 'Direct Supplier'}</strong> • Date: {new Date(exp.expense_date).toLocaleDateString('en-IN')} • Ref: {exp.reference_no || 'N/A'}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-white/40 block uppercase">Payable Total</span>
                          <span className="text-lg font-bold font-mono text-white">
                            ₹{Number(exp.total_payable || exp.amount).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAuthorizeExpense(exp.id)}
                          className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all cursor-pointer shadow-md"
                        >
                          Approve & Pay
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 3: STRATEGY & MEMBERSHIP PLANS
            ══════════════════════════════════════════════════════════ */}
        {activeTab === 'strategy' && (
          <div className="space-y-6">
            {/* Global Discount Strategy Control */}
            <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div>
                  <h3 className="font-display font-bold text-base text-white flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-[#EAD29A]" />
                    Global Patron Discount Architecture
                  </h3>
                  <p className="text-xs text-white/50">
                    Set overall club-wide percentage discounts granted to verified membership holders
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">Pro Shop Member Discount</span>
                    <span className="font-mono text-purple-400 font-bold text-sm">{shopDiscountVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={shopDiscountVal}
                    onChange={(e) => setShopDiscountVal(Number(e.target.value))}
                    className="w-full accent-purple-400 cursor-pointer"
                  />
                  <div className="flex justify-between items-center text-[10px] text-white/40">
                    <span>Applied to apparel, racquets & footwear</span>
                    <button
                      onClick={() => handleSaveDiscount('SHOP', shopDiscountVal)}
                      disabled={isSavingDiscount}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 border border-purple-500/40 cursor-pointer"
                    >
                      Update Strategy
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-white">Cafe & Bar Member Discount</span>
                    <span className="font-mono text-amber-500 font-bold text-sm">{barDiscountVal}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={barDiscountVal}
                    onChange={(e) => setBarDiscountVal(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between items-center text-[10px] text-white/40">
                    <span>Applied automatically at kitchen POS</span>
                    <button
                      onClick={() => handleSaveDiscount('BAR', barDiscountVal)}
                      disabled={isSavingDiscount}
                      className="px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 cursor-pointer"
                    >
                      Update Strategy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Membership Plans Tiers */}
            <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div>
                  <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-[#EAD29A]" />
                    Strategic Membership Tiers & Privileges
                  </h3>
                  <p className="text-xs text-white/50">
                    Configure tier pricing, tenure durations, and bespoke luxury benefits
                  </p>
                </div>
                <button
                  onClick={() => setIsAddPlanOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus size={15} />
                  <span>Deploy New Strategy Tier</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {membershipPlans.map(plan => (
                  <div
                    key={plan.id}
                    className="rounded-2xl bg-gradient-to-b from-white/[0.04] to-white/[0.01] border border-white/10 p-5 space-y-4 hover:border-[#B89047]/40 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#B89047]/20 text-[#EAD29A] border border-[#B89047]/30">
                          {plan.code} Tier
                        </span>
                        <span className="text-xs text-emerald-400 font-semibold">Active</span>
                      </div>
                      <h4 className="font-display text-xl font-bold text-white">{plan.name}</h4>
                      <p className="text-xs text-white/60 line-clamp-2 mt-1">{plan.description}</p>

                      <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Annual / Period Fee</span>
                          <span className="font-bold text-white font-mono">₹{Number(plan.fee).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Duration</span>
                          <span className="text-white/80">{plan.duration_months} Months</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Joining Dues</span>
                          <span className="text-white/80">₹{Number(plan.joining_fee).toLocaleString('en-IN')}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-white/40">Shop / Cafe Perks</span>
                          <span className="text-[#EAD29A] font-semibold">{plan.shop_discount_pct}% / {plan.bar_discount_pct}%</span>
                        </div>
                      </div>

                      {/* Benefits */}
                      {plan.benefits && plan.benefits.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-white/10 space-y-1.5">
                          <span className="text-[10px] font-bold uppercase text-white/50 block">Tier Privileges</span>
                          {plan.benefits.map((b, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-white/70">
                              <Check size={13} className="text-emerald-400 flex-shrink-0" />
                              <span className="truncate">{b}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════
            TAB 4: INVESTOR & EXTERNAL REPORTING
            ══════════════════════════════════════════════════════════ */}
        {activeTab === 'investors' && (
          <div className="space-y-6">
            <div className="rounded-3xl bg-white/[0.02] border border-white/10 p-6 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
                    <Share2 className="w-5 h-5 text-[#EAD29A]" />
                    External Investor & Auditor Briefing Links
                  </h3>
                  <p className="text-xs text-white/50">
                    Generate secure 7-day cryptographically hashed links for Board of Governors, auditors, and banks
                  </p>
                </div>
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md self-start sm:self-auto"
                >
                  <Plus size={15} />
                  <span>Generate Board Link</span>
                </button>
              </div>

              {/* Active Report Shares Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-white/10 text-white/40 font-semibold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-3">Report Scope</th>
                      <th className="py-3 px-3">Recipient</th>
                      <th className="py-3 px-3">Created By</th>
                      <th className="py-3 px-3">Expires At</th>
                      <th className="py-3 px-3">Views</th>
                      <th className="py-3 px-3 text-right">Access Link</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {reportShares.map(share => {
                      const link = `http://localhost:5173/reports/share/${share.share_token}`;
                      return (
                        <tr key={share.id} className="hover:bg-white/[0.02]">
                          <td className="py-3 px-3 font-semibold text-white capitalize">
                            {share.report_type.replace(/_/g, ' ')}
                          </td>
                          <td className="py-3 px-3">
                            <p className="text-white font-medium">{share.recipient_name || 'Confidential'}</p>
                            <p className="text-[10px] text-white/40">{share.recipient_email || 'Direct access token'}</p>
                          </td>
                          <td className="py-3 px-3 text-white/70">
                            {share.created_by_name || 'Rajesh Malhotra'}
                          </td>
                          <td className="py-3 px-3 text-white/50 text-[11px]">
                            {new Date(share.expires_at || Date.now()).toLocaleDateString('en-IN')}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white">
                              {share.view_count} views
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => copyToClipboard(link)}
                              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-[#EAD29A] border border-[#B89047]/30 transition-all cursor-pointer inline-flex items-center gap-1.5"
                            >
                              <Copy size={13} />
                              <span>Copy Token Link</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ── MODAL: CREATE MEMBERSHIP PLAN STRATEGY ─────────────────── */}
      {isAddPlanOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-[#14141A] border border-white/10 p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-display font-bold text-base text-white">Deploy Strategic Membership Tier</h3>
              <button
                onClick={() => setIsAddPlanOpen(false)}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                    Plan Code (e.g. PLATINUM)
                  </label>
                  <input
                    type="text"
                    value={planForm.code}
                    onChange={(e) => setPlanForm({ ...planForm, code: e.target.value.toUpperCase() })}
                    placeholder="PLATINUM"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono outline-none focus:border-[#B89047]"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={planForm.name}
                    onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                    placeholder="Platinum Executive"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-[#B89047]"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                  Tagline / Description
                </label>
                <input
                  type="text"
                  value={planForm.description}
                  onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
                  placeholder="Ultra-exclusive access with complimentary court reservations and lounge valet"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-[#B89047]"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                    Duration (Months)
                  </label>
                  <input
                    type="number"
                    value={planForm.duration_months}
                    onChange={(e) => setPlanForm({ ...planForm, duration_months: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                    Membership Fee (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={planForm.fee}
                    onChange={(e) => setPlanForm({ ...planForm, fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                    Joining Dues (₹)
                  </label>
                  <input
                    type="number"
                    value={planForm.joining_fee}
                    onChange={(e) => setPlanForm({ ...planForm, joining_fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                    Shop Discount (%)
                  </label>
                  <input
                    type="number"
                    value={planForm.shop_discount_pct}
                    onChange={(e) => setPlanForm({ ...planForm, shop_discount_pct: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                    Cafe Discount (%)
                  </label>
                  <input
                    type="number"
                    value={planForm.bar_discount_pct}
                    onChange={(e) => setPlanForm({ ...planForm, bar_discount_pct: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                  Tier Privileges (1 per line)
                </label>
                <textarea
                  rows={3}
                  value={planForm.benefits}
                  onChange={(e) => setPlanForm({ ...planForm, benefits: e.target.value })}
                  placeholder="Unlimited prime court bookings&#10;Private locker & towel service&#10;Access to Owner's Lounge"
                  className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-[#B89047]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingPlan}
                className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all mt-4 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingPlan ? 'Establishing Strategy Tier...' : 'Deploy Plan Strategy'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: GENERATE INVESTOR REPORT LINK ───────────────────── */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#14141A] border border-white/10 p-6 shadow-2xl space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="font-display font-bold text-base text-white">Generate Secure Investor Share</h3>
              <button
                onClick={() => {
                  setIsShareModalOpen(false);
                  setGeneratedLink('');
                }}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60"
              >
                <X size={16} />
              </button>
            </div>

            {!generatedLink ? (
              <form onSubmit={handleGenerateShare} className="space-y-3">
                <div>
                  <label className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                    Report Schedule Type *
                  </label>
                  <select
                    value={shareReportType}
                    onChange={(e) => setShareReportType(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-[#B89047] cursor-pointer"
                  >
                    <option value="monthly_summary">Monthly Executive Summary</option>
                    <option value="revenue_by_source">Revenue by Source Breakdown</option>
                    <option value="payables">Payables & Expenditures</option>
                    <option value="tax_summary">GST & Tax Summary</option>
                    <option value="weekly_summary">Weekly Operational Brief</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                    Recipient Group / Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={shareRecipientName}
                    onChange={(e) => setShareRecipientName(e.target.value)}
                    placeholder="e.g. Board of Governors or KPMG Auditor"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-[#B89047]"
                  />
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-white/60 block mb-1">
                    Recipient Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={shareRecipientEmail}
                    onChange={(e) => setShareRecipientEmail(e.target.value)}
                    placeholder="investor@example.com"
                    className="w-full px-3 py-2 rounded-xl bg-black/40 border border-white/10 text-white outline-none focus:border-[#B89047]"
                  />
                </div>

                <p className="text-[11px] text-white/50">
                  The link will be cryptographically signed and expire automatically in 7 days.
                </p>

                <button
                  type="submit"
                  disabled={isGeneratingShare}
                  className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all mt-4 cursor-pointer disabled:opacity-50"
                >
                  {isGeneratingShare ? 'Generating Token...' : 'Create Secure Link'}
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-1" />
                  <p className="font-bold text-emerald-300">Secure Access Link Generated</p>
                  <p className="text-[11px] text-white/60 mt-0.5">Valid for 7 days with live view count tracking</p>
                </div>

                <div className="p-3 rounded-xl bg-black/60 border border-white/10 font-mono text-[11px] text-[#EAD29A] break-all">
                  {generatedLink}
                </div>

                <button
                  onClick={() => copyToClipboard(generatedLink)}
                  className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                >
                  {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  <span>{isCopied ? 'Link Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerPage;
