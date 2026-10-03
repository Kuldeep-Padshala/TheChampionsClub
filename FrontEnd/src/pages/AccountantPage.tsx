import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useSearchParams } from 'react-router-dom';
import {
  DollarSign,
  TrendingUp,
  Receipt,
  Users,
  FileText,
  Calendar,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  Plus,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  Download,
  ShieldCheck,
  Clock,
  Send,
  Eye,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { accountantService } from '../services/accountantService';
import {
  Expense,
  ExpenseCategory,
  Supplier,
  PayrollRun,
  PayrollItem,
  TaxSummary,
  TaxReturn,
  PnLStatement,
  AccountantStats
} from '../types/accountant.types';
import { cn } from '../utils/cn';

export const AccountantPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'pnl';

  const setTab = (tab: string) => {
    setSearchParams({ tab });
  };

  // State
  const [stats, setStats] = useState<AccountantStats | null>(null);
  const [pnl, setPnl] = useState<PnLStatement | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRun[]>([]);
  const [selectedRunItems, setSelectedRunItems] = useState<PayrollItem[] | null>(null);
  const [selectedRunId, setSelectedRunId] = useState<number | null>(null);
  const [taxSummary, setTaxSummary] = useState<TaxSummary | null>(null);
  const [taxReturns, setTaxReturns] = useState<TaxReturn[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Record Expense Modal State
  const [isRecordExpenseOpen, setIsRecordExpenseOpen] = useState(false);
  const [newExpenseCat, setNewExpenseCat] = useState<number>(1);
  const [newExpenseVendor, setNewExpenseVendor] = useState('');
  const [newExpenseDesc, setNewExpenseDesc] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseTax, setNewExpenseTax] = useState('');
  const [newExpenseDueDate, setNewExpenseDueDate] = useState('');
  const [isSubmittingExpense, setIsSubmittingExpense] = useState(false);

  // Pay Expense Modal State
  const [payingExpense, setPayingExpense] = useState<Expense | null>(null);
  const [payMethod, setPayMethod] = useState('Bank Transfer');
  const [payRefNo, setPayRefNo] = useState('');
  const [isSubmittingPay, setIsSubmittingPay] = useState(false);

  // File Tax Return Modal State
  const [isFileTaxOpen, setIsFileTaxOpen] = useState(false);
  const [taxRefNo, setTaxRefNo] = useState('');
  const [taxNotes, setTaxNotes] = useState('');
  const [isSubmittingTax, setIsSubmittingTax] = useState(false);

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [
        statsData,
        pnlData,
        expensesData,
        catsData,
        supsData,
        runsData,
        taxSummData,
        returnsData
      ] = await Promise.all([
        accountantService.getStats().catch(() => null),
        accountantService.getPnLStatement().catch(() => null),
        accountantService.getExpenses().catch(() => []),
        accountantService.getExpenseCategories().catch(() => []),
        accountantService.getSuppliers().catch(() => []),
        accountantService.getPayrollRuns().catch(() => []),
        accountantService.getTaxSummary().catch(() => null),
        accountantService.getTaxReturns().catch(() => []),
      ]);

      if (statsData) setStats(statsData);
      if (pnlData) setPnl(pnlData);
      setExpenses(expensesData);
      setCategories(catsData);
      setSuppliers(supsData);
      setPayrollRuns(runsData);
      if (taxSummData) setTaxSummary(taxSummData);
      setTaxReturns(returnsData);
    } catch (err) {
      console.error('Failed to load accounting data', err);
      toast.error('Failed to load financial records');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Submit New Expense
  const handleRecordExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExpenseDesc || !newExpenseAmount) {
      toast.error('Description and amount are required');
      return;
    }

    setIsSubmittingExpense(true);
    try {
      await accountantService.recordExpense({
        category_id: Number(newExpenseCat),
        vendor_name: newExpenseVendor || undefined,
        description: newExpenseDesc,
        amount: Number(newExpenseAmount),
        tax_amount: newExpenseTax ? Number(newExpenseTax) : 0,
        due_date: newExpenseDueDate || undefined,
      });

      toast.success('Expense recorded into ledger');
      setIsRecordExpenseOpen(false);
      setNewExpenseDesc('');
      setNewExpenseAmount('');
      setNewExpenseTax('');
      setNewExpenseVendor('');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to record expense');
    } finally {
      setIsSubmittingExpense(false);
    }
  };

  // Settle / Pay Expense
  const handlePayExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingExpense) return;

    setIsSubmittingPay(true);
    try {
      await accountantService.payExpense(payingExpense.id, {
        payment_method: payMethod,
        reference_no: payRefNo || undefined,
      });

      toast.success(`Expense #${payingExpense.id} marked as paid`);
      setPayingExpense(null);
      setPayRefNo('');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to mark expense paid');
    } finally {
      setIsSubmittingPay(false);
    }
  };

  // Run New Payroll Draft
  const handleRunPayroll = async () => {
    try {
      const monthStr = new Date().toISOString().substring(0, 7) + '-01';
      const res = await accountantService.runPayroll({
        period_month: monthStr,
        notes: `Payroll for ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
      });

      toast.success(`Payroll generated for ${res.employeeCount} staff! Total: ₹${res.totalAmount.toLocaleString()}`);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to run payroll');
    }
  };

  // View Payroll Items
  const handleViewPayrollItems = async (runId: number) => {
    try {
      const items = await accountantService.getPayrollItems(runId);
      setSelectedRunItems(items);
      setSelectedRunId(runId);
    } catch (err: any) {
      toast.error('Failed to load payslip items');
    }
  };

  // Approve Payroll Run
  const handleApprovePayroll = async (runId: number) => {
    try {
      await accountantService.approvePayroll(runId);
      toast.success('Payroll approved & disbursed to employees');
      if (selectedRunId === runId) {
        handleViewPayrollItems(runId);
      }
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve payroll');
    }
  };

  // File Tax Return
  const handleFileTaxReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taxSummary) return;

    setIsSubmittingTax(true);
    try {
      const res = await accountantService.fileTaxReturn({
        tax_type: 'GST',
        period_start: taxSummary.period.start_date,
        period_end: taxSummary.period.end_date,
        total_tax_collected: taxSummary.tax_collected,
        total_tax_paid: taxSummary.tax_paid,
        net_payable: taxSummary.net_tax_payable,
        reference_no: taxRefNo || `GST-FY26-${Date.now().toString().slice(-6)}`,
        notes: taxNotes || 'GST Return approved and filed by Club Accountant',
      });

      toast.success(`Tax return filed successfully! Ref #${res.reference_no}`);
      setIsFileTaxOpen(false);
      setTaxRefNo('');
      setTaxNotes('');
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to file tax return');
    } finally {
      setIsSubmittingTax(false);
    }
  };

  // Total Pending Expenses
  const pendingExpenses = useMemo(() => {
    return expenses.filter((e) => e.status === 'pending' || e.status === 'unpaid');
  }, [expenses]);

  return (
    <div className="min-h-screen bg-[#F8F7F4] dark:bg-[#0A0A0D] text-[#1D1D1F] dark:text-[#FAF8F5] pt-24 pb-16 px-3 sm:px-6 lg:px-8 font-sans selection:bg-[#B89047]/30 transition-colors">
      {/* ── Top Header / Station Badge ────────────────────────────── */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-white dark:bg-gradient-to-r dark:from-[#14141A] dark:via-[#1A1A24] dark:to-[#121216] border border-[#E5E5EA] dark:border-white/10 shadow-lg dark:shadow-2xl relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#B89047]/10 blur-3xl pointer-events-none" />

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#EAD29A] via-[#B89047] to-[#7D5A1E] p-[2px] shadow-lg shadow-[#B89047]/20 flex-shrink-0">
              <div className="w-full h-full rounded-2xl bg-[#F8F7F4] dark:bg-[#0D0D12] flex items-center justify-center">
                <DollarSign className="w-7 h-7 text-[#B89047] dark:text-[#EAD29A]" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest uppercase bg-[#B89047]/20 text-[#8C6826] dark:text-[#EAD29A] border border-[#B89047]/30">
                  Finance & Audit
                </span>
                <span className="text-xs text-gray-500 dark:text-white/50 flex items-center gap-1">
                  <ShieldCheck size={13} className="text-emerald-500 dark:text-emerald-400" /> Chartered Accounting
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-[#1D1D1F] dark:text-white mt-1">
                Financial Operations & Accounting Suite
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-white/60">
                Auditor: <strong className="text-[#1D1D1F] dark:text-white">{user?.name || 'Meera Bhatt'}</strong> • P&L Reporting, Payroll Engine & GST Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-white/80 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-[#E5E5EA] dark:border-white/10 transition-all flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw size={14} className={cn(isLoading && 'animate-spin')} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>

        {/* ── KPI Metric Cards ─────────────────────────────────────── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-[#E5E5EA] dark:border-white/10 shadow-sm dark:shadow-none">
            <span className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider block">
              Invoiced Revenue
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-[#B89047] dark:text-[#EAD29A]">
                ₹{(stats?.totalRevenue ?? pnl?.revenue ?? 0).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-[#E5E5EA] dark:border-white/10 shadow-sm dark:shadow-none">
            <span className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider block">
              Pending Bills & Vouchers
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-rose-500 dark:text-rose-400">
                {pendingExpenses.length}
              </span>
              <span className="text-xs text-gray-400 dark:text-white/40">Unpaid</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-[#E5E5EA] dark:border-white/10 shadow-sm dark:shadow-none">
            <span className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider block">
              Latest Staff Payroll
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-[#1D1D1F] dark:text-white">
                ₹{Number(stats?.latestPayroll?.total_payout || 0).toLocaleString()}
              </span>
              <span className="text-xs text-emerald-600 dark:text-emerald-400">
                {stats?.latestPayroll?.emp_count ?? 5} staff
              </span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-[#E5E5EA] dark:border-white/10 shadow-sm dark:shadow-none">
            <span className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider block">
              Net Profit Margin
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400">
                {pnl?.profit_margin || 'N/A'}
              </span>
              <span className="text-xs text-gray-400 dark:text-white/40">FY2026</span>
            </div>
          </div>
        </div>

        {/* ── Sub Navigation Tabs ──────────────────────────────────── */}
        <div className="flex items-center gap-2 mt-6 p-1.5 rounded-2xl bg-black/[0.03] dark:bg-white/[0.04] border border-[#E5E5EA] dark:border-white/10 overflow-x-auto">
          <button
            onClick={() => setTab('pnl')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'pnl'
                ? 'bg-gradient-to-r from-[#B89047] to-[#8C6826] text-white shadow-lg shadow-[#B89047]/20 font-bold'
                : 'text-gray-600 dark:text-white/60 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <TrendingUp size={16} />
            <span>P&L Statement</span>
          </button>

          <button
            onClick={() => setTab('expenses')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap relative',
              activeTab === 'expenses'
                ? 'bg-gradient-to-r from-[#B89047] to-[#8C6826] text-white shadow-lg shadow-[#B89047]/20 font-bold'
                : 'text-gray-600 dark:text-white/60 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <Receipt size={16} />
            <span>Expense Ledger</span>
            {pendingExpenses.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white">
                {pendingExpenses.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setTab('payroll')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'payroll'
                ? 'bg-gradient-to-r from-[#B89047] to-[#8C6826] text-white shadow-lg shadow-[#B89047]/20 font-bold'
                : 'text-gray-600 dark:text-white/60 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <Users size={16} />
            <span>Staff Payroll Engine</span>
          </button>

          <button
            onClick={() => setTab('taxes')}
            className={cn(
              'px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap',
              activeTab === 'taxes'
                ? 'bg-gradient-to-r from-[#B89047] to-[#8C6826] text-white shadow-lg shadow-[#B89047]/20 font-bold'
                : 'text-gray-600 dark:text-white/60 hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'
            )}
          >
            <FileText size={16} />
            <span>GST & Compliance</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: P&L FINANCIAL STATEMENT ───────────────────────── */}
      {activeTab === 'pnl' && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#14141A] dark:to-[#0D0D12] border border-black/10 dark:border-white/10 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
              <div>
                <h2 className="text-xl font-display font-bold text-[#1D1D1F] dark:text-white">
                  Executive Statement of Profit & Loss
                </h2>
                <p className="text-xs text-gray-500 dark:text-white/50">
                  Comprehensive audit statement covering all membership dues, court receipts, pro shop orders, and operational expenditures.
                </p>
              </div>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-white/80 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 transition-all flex items-center gap-2 cursor-pointer self-start"
              >
                <Download size={14} />
                <span>Export / Print Report</span>
              </button>
            </div>

            {/* Income & Expense Big Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Gross Revenue */}
              <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-emerald-600 dark:text-emerald-400">
                    Total Operating Revenue
                  </span>
                  <ArrowUpRight size={18} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1D1D1F] dark:text-white mt-2">
                  ₹{(pnl?.revenue ?? 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/70 mt-1">
                  From {pnl?.invoice_count ?? 19} paid invoices & member subscriptions
                </p>
              </div>

              {/* Total Operating Costs */}
              <div className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400">
                    Total Operating Costs
                  </span>
                  <ArrowDownRight size={18} className="text-rose-600 dark:text-rose-400" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1D1D1F] dark:text-white mt-2">
                  ₹{(pnl?.costs.total_costs ?? 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-rose-700/80 dark:text-rose-300/70 mt-1">
                  Expenses (₹{(pnl?.costs.expenses ?? 0).toLocaleString()}) + Payroll (₹{(pnl?.costs.payroll ?? 0).toLocaleString()})
                </p>
              </div>

              {/* Net Profit */}
              <div
                className={cn(
                  'p-5 rounded-2xl border',
                  (pnl?.net_profit ?? 0) >= 0
                    ? 'bg-[#B89047]/10 border-[#B89047]/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-bold tracking-wider text-[#B89047] dark:text-[#EAD29A]">
                    Net Financial Profit
                  </span>
                  <Percent size={18} className="text-[#B89047] dark:text-[#EAD29A]" />
                </div>
                <div className="text-3xl font-display font-bold text-[#1D1D1F] dark:text-white mt-2">
                  ₹{(pnl?.net_profit ?? 0).toLocaleString()}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-white/50 mt-1">
                  Margin: <strong className="text-[#B89047] dark:text-[#EAD29A]">{pnl?.profit_margin}</strong>
                </p>
              </div>
            </div>

            {/* Categorized Expenses List */}
            <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-3">
              <h3 className="font-display font-bold text-sm text-[#1D1D1F] dark:text-white">
                Expenditures by Business Category
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {pnl?.costs.expenses_by_category && pnl.costs.expenses_by_category.length > 0 ? (
                  pnl.costs.expenses_by_category.map((c, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl bg-stone-50 dark:bg-white/[0.02] border border-black/5 dark:border-white/5 flex items-center justify-between text-xs"
                    >
                      <span className="font-medium text-gray-700 dark:text-white/80">{c.name}</span>
                      <span className="font-mono font-bold text-[#1D1D1F] dark:text-white">
                        ₹{c.total.toLocaleString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-4 text-center rounded-2xl bg-stone-50 dark:bg-white/[0.02] text-xs text-gray-400 dark:text-white/40">
                    No approved category expenditures logged for the active period.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: EXPENSE LEDGER ─────────────────────────────────── */}
      {activeTab === 'expenses' && (
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 shadow-sm">
            <div>
              <h2 className="text-lg font-display font-bold text-[#1D1D1F] dark:text-white">
                Accounts Payable & Expense Ledger
              </h2>
              <p className="text-xs text-gray-500 dark:text-white/50">
                Record utility bills, maintenance charges, and supplier vouchers. Settle payments with 1-click.
              </p>
            </div>
            <button
              onClick={() => setIsRecordExpenseOpen(true)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md self-start"
            >
              <Plus size={15} />
              <span>Record Expense</span>
            </button>
          </div>

          {/* Expenses Table */}
          <div className="rounded-3xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 dark:bg-black/40 border-b border-black/10 dark:border-white/10 text-gray-500 dark:text-white/50 uppercase tracking-wider font-mono">
                  <tr>
                    <th className="py-3 px-4">Expense ID</th>
                    <th className="py-3 px-4">Vendor / Supplier</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Tax (GST)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5 dark:divide-white/5 text-gray-800 dark:text-white/80 font-sans">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                      <td className="py-3 px-4 font-mono text-[#B89047] dark:text-[#EAD29A] font-bold">
                        #{exp.id}
                      </td>
                      <td className="py-3 px-4 font-medium text-[#1D1D1F] dark:text-white">
                        {exp.vendor_name || exp.supplier_name || 'General Vendor'}
                      </td>
                      <td className="py-3 px-4 max-w-xs truncate text-gray-600 dark:text-white/70">
                        {exp.description}
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-white/60">
                        {exp.category_name || 'Operating'}
                      </td>
                      <td className="py-3 px-4 font-bold text-[#1D1D1F] dark:text-white font-mono">
                        ₹{Number(exp.amount).toLocaleString()}
                      </td>
                      <td className="py-3 px-4 font-mono text-gray-500 dark:text-white/50">
                        ₹{Number(exp.tax_amount || 0).toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        {exp.status === 'paid' ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                            Paid
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                            Unpaid
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {exp.status !== 'paid' ? (
                          <button
                            onClick={() => setPayingExpense(exp)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-black bg-[#EAD29A] hover:bg-[#B89047] transition-all cursor-pointer active:scale-95"
                          >
                            Settle / Pay
                          </button>
                        ) : (
                          <span className="text-[11px] text-gray-400 dark:text-white/40 font-mono">
                            {exp.payment_method || 'Settled'}
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

      {/* ── TAB 3: STAFF PAYROLL ENGINE ──────────────────────────── */}
      {activeTab === 'payroll' && (
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-white/[0.03] border border-black/10 dark:border-white/10 shadow-sm">
            <div>
              <h2 className="text-lg font-display font-bold text-[#1D1D1F] dark:text-white">
                Monthly Staff Payroll Runs
              </h2>
              <p className="text-xs text-gray-500 dark:text-white/50">
                Automated monthly salary calculation with tax withholding and direct bank disbursement.
              </p>
            </div>
            <button
              onClick={handleRunPayroll}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md self-start"
            >
              <Plus size={15} />
              <span>Generate Payroll Run</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {payrollRuns.map((run) => (
              <div
                key={run.id}
                className="p-5 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#14141A] dark:to-[#0D0D12] border border-black/10 dark:border-white/10 hover:border-[#B89047]/40 transition-all shadow-xl space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-mono text-[#B89047] dark:text-[#EAD29A] font-bold block">
                      PAYROLL RUN #{run.id}
                    </span>
                    <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white mt-0.5">
                      {new Date(run.period_month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-white/50">{run.notes || 'Monthly Staff Disbursement'}</p>
                  </div>

                  <span
                    className={cn(
                      'px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider',
                      run.status === 'paid'
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    )}
                  >
                    {run.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 p-3 rounded-2xl bg-stone-50 dark:bg-black/40 border border-black/5 dark:border-white/5 text-xs">
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-white/40 block">Eligible Staff</span>
                    <span className="font-bold text-[#1D1D1F] dark:text-white">{run.employee_count} Employees</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-gray-500 dark:text-white/40 block">Total Payout</span>
                    <span className="font-bold text-[#B89047] dark:text-[#EAD29A] font-mono">
                      ₹{Number(run.total_payout).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleViewPayrollItems(run.id)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-white bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 border border-black/10 dark:border-white/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye size={13} />
                    <span>View Payslips</span>
                  </button>

                  {run.status !== 'paid' && (
                    <button
                      onClick={() => handleApprovePayroll(run.id)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold text-black bg-[#EAD29A] hover:bg-[#B89047] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 size={13} />
                      <span>Approve & Disburse</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Payslips Detail Drawer / Modal */}
          {selectedRunItems && createPortal(
            <div data-lenis-prevent className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
              <div className="w-full max-w-3xl max-h-[85vh] rounded-3xl bg-white dark:bg-[#14141A] border border-[#E5E5EA] dark:border-white/10 p-6 shadow-2xl flex flex-col space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#E5E5EA] dark:border-white/10">
                  <div>
                    <h3 className="text-base font-display font-bold text-[#1D1D1F] dark:text-white">
                      Payroll Payslips Breakdown (Run #{selectedRunId})
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-white/50">
                      Detailed individual staff compensation vouchers &amp; bank transfer details.
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedRunItems(null)}
                    className="p-2 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 hover:text-[#1D1D1F] dark:hover:text-white cursor-pointer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="overflow-y-auto flex-1 space-y-2 pr-1">
                  {selectedRunItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-[#E5E5EA] dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                          <span>{item.full_name}</span>
                          <span className="font-mono text-[10px] text-gray-400 dark:text-white/40">({item.employee_code})</span>
                        </div>
                        <div className="text-[11px] text-gray-500 dark:text-white/50">
                          {item.job_title} • {item.department} ({item.pay_type})
                        </div>
                        {item.bank_name && (
                          <div className="text-[10px] text-gray-400 dark:text-white/40 font-mono mt-0.5">
                            Bank: {item.bank_name} • A/C: {item.bank_account_number} • IFSC: {item.bank_ifsc}
                          </div>
                        )}
                      </div>

                      <div className="text-right sm:text-right flex sm:flex-col justify-between items-baseline sm:items-end">
                        <div className="text-gray-500 dark:text-white/60 font-mono text-[11px]">
                          Gross: ₹{Number(item.gross_pay).toLocaleString()} - TDS: ₹{Number(item.tax_deducted).toLocaleString()}
                        </div>
                        <div className="text-sm font-bold text-[#B89047] dark:text-[#EAD29A] font-mono mt-0.5">
                          Net Pay: ₹{Number(item.net_pay).toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-3 border-t border-[#E5E5EA] dark:border-white/10 flex justify-end">
                  <button
                    onClick={() => setSelectedRunItems(null)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold text-black bg-[#EAD29A] hover:bg-[#B89047] transition-all cursor-pointer"
                  >
                    Close Breakdown
                  </button>
                </div>
              </div>
            </div>,
            document.body
          )}
        </div>
      )}

      {/* ── TAB 4: GST & TAX COMPLIANCE ──────────────────────────── */}
      {activeTab === 'taxes' && (
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-gradient-to-b dark:from-[#14141A] dark:to-[#0D0D12] border border-black/10 dark:border-white/10 shadow-2xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-black/10 dark:border-white/10">
              <div>
                <h2 className="text-xl font-display font-bold text-[#1D1D1F] dark:text-white">
                  Goods & Services Tax (GST) Summary
                </h2>
                <p className="text-xs text-gray-500 dark:text-white/50">
                  Automated computation of Output Tax Liability vs Input Tax Credit (ITC) with filing history.
                </p>
              </div>
              <button
                onClick={() => setIsFileTaxOpen(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-md self-start"
              >
                <Plus size={15} />
                <span>File Tax Return</span>
              </button>
            </div>

            {/* Tax Computation Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
                <span className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider block">
                  Output GST Collected (Sales)
                </span>
                <div className="text-2xl font-bold font-display text-[#1D1D1F] dark:text-white mt-1">
                  ₹{(taxSummary?.tax_collected ?? 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-gray-400 dark:text-white/40 block mt-1">
                  From ₹{(taxSummary?.total_sales ?? 0).toLocaleString()} gross sales
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-white/[0.03] border border-black/10 dark:border-white/10">
                <span className="text-[11px] font-medium text-gray-500 dark:text-white/50 uppercase tracking-wider block">
                  Input Tax Credit (Expenses)
                </span>
                <div className="text-2xl font-bold font-display text-emerald-600 dark:text-emerald-400 mt-1">
                  ₹{(taxSummary?.tax_paid ?? 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-gray-400 dark:text-white/40 block mt-1">
                  Paid on verified purchases
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#B89047]/10 border border-[#B89047]/30">
                <span className="text-[11px] font-medium text-[#B89047] dark:text-[#EAD29A] uppercase tracking-wider block">
                  Net Tax Payable to Govt
                </span>
                <div className="text-2xl font-bold font-display text-[#B89047] dark:text-[#EAD29A] mt-1">
                  ₹{(taxSummary?.net_tax_payable ?? 0).toLocaleString()}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-white/50 block mt-1">
                  Output Tax - Input Tax Credit
                </span>
              </div>
            </div>

            {/* Filed Returns Table */}
            <div className="pt-4 border-t border-black/10 dark:border-white/10 space-y-3">
              <h3 className="font-display font-bold text-sm text-[#1D1D1F] dark:text-white">
                Historical Tax Filings & Acknowledgment Receipts
              </h3>

              <div className="rounded-2xl border border-black/10 dark:border-white/10 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-50 dark:bg-black/40 border-b border-black/10 dark:border-white/10 text-gray-500 dark:text-white/50 uppercase tracking-wider font-mono">
                    <tr>
                      <th className="py-3 px-4">Tax Type</th>
                      <th className="py-3 px-4">Period</th>
                      <th className="py-3 px-4">Tax Collected</th>
                      <th className="py-3 px-4">Tax Credit</th>
                      <th className="py-3 px-4">Net Payable</th>
                      <th className="py-3 px-4">Ack. Ref #</th>
                      <th className="py-3 px-4 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5 text-gray-800 dark:text-white/80 font-sans">
                    {taxReturns.map((tr) => (
                      <tr key={tr.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                        <td className="py-3 px-4 font-bold text-[#1D1D1F] dark:text-white font-mono">{tr.tax_type}</td>
                        <td className="py-3 px-4 font-mono text-gray-600 dark:text-white/60">
                          {new Date(tr.period_start).toLocaleDateString()} – {new Date(tr.period_end).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4 font-mono">₹{Number(tr.tax_collected).toLocaleString()}</td>
                        <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400">₹{Number(tr.tax_credit).toLocaleString()}</td>
                        <td className="py-3 px-4 font-bold text-[#B89047] dark:text-[#EAD29A] font-mono">
                          ₹{Number(tr.net_payable).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-mono text-gray-600 dark:text-white/60">
                          {tr.reference_no || 'TXN-PENDING'}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span
                            className={cn(
                              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase',
                              tr.status === 'filed'
                                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                            )}
                          >
                            {tr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: RECORD EXPENSE ─────────────────────────────────── */}
      {isRecordExpenseOpen && createPortal(
        <div data-lenis-prevent className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-[#14141A] border border-black/10 dark:border-white/10 p-6 shadow-2xl space-y-4 text-[#1D1D1F] dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <h3 className="font-display font-bold text-base text-[#1D1D1F] dark:text-white">Record Operating Expense</h3>
              <button
                onClick={() => setIsRecordExpenseOpen(false)}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleRecordExpense} className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                  Category
                </label>
                <select
                  value={newExpenseCat}
                  onChange={(e) => setNewExpenseCat(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-[#B89047]"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                  Vendor / Supplier Name
                </label>
                <input
                  type="text"
                  value={newExpenseVendor}
                  onChange={(e) => setNewExpenseVendor(e.target.value)}
                  placeholder="e.g. Tata Power, FixIt Bros, Metro Mart"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-[#B89047]"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  value={newExpenseDesc}
                  onChange={(e) => setNewExpenseDesc(e.target.value)}
                  placeholder="e.g. Monthly Electricity or Squash Court Repairs"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-[#B89047]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newExpenseAmount}
                    onChange={(e) => setNewExpenseAmount(e.target.value)}
                    placeholder="2500.00"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-[#B89047] font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                    Tax / GST (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newExpenseTax}
                    onChange={(e) => setNewExpenseTax(e.target.value)}
                    placeholder="450.00"
                    className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-[#B89047] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={newExpenseDueDate}
                  onChange={(e) => setNewExpenseDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-[#B89047]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingExpense}
                className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all mt-4 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingExpense ? 'Saving to Ledger...' : 'Save Expense Voucher'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: PAY EXPENSE ────────────────────────────────────── */}
      {payingExpense && createPortal(
        <div data-lenis-prevent className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#14141A] border border-black/10 dark:border-white/10 p-6 shadow-2xl space-y-4 text-xs text-[#1D1D1F] dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <h3 className="font-display font-bold text-base text-[#1D1D1F] dark:text-white">Settle Expense Voucher</h3>
              <button
                onClick={() => setPayingExpense(null)}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-black/40 border border-black/5 dark:border-white/5 space-y-1">
              <div className="font-bold text-[#1D1D1F] dark:text-white">{payingExpense.description}</div>
              <div className="text-[11px] text-gray-500 dark:text-white/50">
                Vendor: {payingExpense.vendor_name || 'Operating Vendor'}
              </div>
              <div className="text-base font-bold font-mono text-[#B89047] dark:text-[#EAD29A] pt-1">
                ₹{Number(payingExpense.amount).toLocaleString()}
              </div>
            </div>

            <form onSubmit={handlePayExpense} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                  Payment Method
                </label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-[#B89047]"
                >
                  <option value="Bank Transfer">Bank Direct Transfer</option>
                  <option value="UPI">Corporate UPI / QR</option>
                  <option value="Cheque">Club Cheque</option>
                  <option value="Cash">Petty Cash</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                  Transaction / Cheque Reference #
                </label>
                <input
                  type="text"
                  value={payRefNo}
                  onChange={(e) => setPayRefNo(e.target.value)}
                  placeholder="e.g. UTR-982187319"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-[#B89047] font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingPay}
                className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-emerald-400 to-emerald-500 hover:brightness-105 active:scale-95 transition-all mt-4 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingPay ? 'Settling Voucher...' : 'Confirm & Disburse Payment'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* ── MODAL: FILE TAX RETURN ────────────────────────────────── */}
      {isFileTaxOpen && createPortal(
        <div data-lenis-prevent className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#14141A] border border-black/10 dark:border-white/10 p-6 shadow-2xl space-y-4 text-xs text-[#1D1D1F] dark:text-white">
            <div className="flex items-center justify-between pb-3 border-b border-black/10 dark:border-white/10">
              <h3 className="font-display font-bold text-base text-[#1D1D1F] dark:text-white">File Official Tax Return</h3>
              <button
                onClick={() => setIsFileTaxOpen(false)}
                className="p-1.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 text-gray-500 dark:text-white/60 cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-stone-50 dark:bg-black/40 border border-black/5 dark:border-white/5 space-y-1">
              <div className="text-[11px] text-gray-500 dark:text-white/50">Calculated Net Tax Liability:</div>
              <div className="text-xl font-bold font-mono text-[#B89047] dark:text-[#EAD29A]">
                ₹{(taxSummary?.net_tax_payable ?? 0).toLocaleString()}
              </div>
            </div>

            <form onSubmit={handleFileTaxReturn} className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                  Challan / Filing Reference #
                </label>
                <input
                  type="text"
                  value={taxRefNo}
                  onChange={(e) => setTaxRefNo(e.target.value)}
                  placeholder={`GST-ACK-${Date.now().toString().slice(-6)}`}
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-[#B89047] font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-gray-500 dark:text-white/60 block mb-1">
                  Auditor Notes
                </label>
                <input
                  type="text"
                  value={taxNotes}
                  onChange={(e) => setTaxNotes(e.target.value)}
                  placeholder="GST Return verified by Bhatt & Associates"
                  className="w-full px-3 py-2 rounded-xl bg-stone-50 dark:bg-black/40 border border-black/10 dark:border-white/10 text-[#1D1D1F] dark:text-white outline-none focus:border-[#B89047]"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingTax}
                className="w-full py-3 rounded-xl font-bold text-black bg-gradient-to-r from-[#EAD29A] to-[#B89047] hover:brightness-105 active:scale-95 transition-all mt-4 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingTax ? 'Transmitting Return...' : 'Authorize & File Return'}
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default AccountantPage;
