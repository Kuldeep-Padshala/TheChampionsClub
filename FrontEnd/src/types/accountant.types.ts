export interface Expense {
  id: number;
  category_id: number;
  category_name?: string;
  category_type?: string;
  supplier_id?: number | null;
  supplier_name?: string;
  vendor_name?: string;
  description: string;
  amount: number | string;
  tax_amount: number | string;
  expense_date: string;
  due_date?: string;
  status: 'pending' | 'unpaid' | 'paid' | 'cancelled';
  paid_at?: string;
  payment_method?: string;
  reference_no?: string;
  recorded_by_name?: string;
  created_at: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  type?: string;
  is_active: number;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  tax_id?: string;
  address?: string;
}

export interface PayrollRun {
  id: number;
  period_month: string;
  status: 'draft' | 'approved' | 'paid';
  creator_name?: string;
  approver_name?: string;
  approved_at?: string;
  paid_at?: string;
  notes?: string;
  employee_count: number;
  emp_count?: number;
  total_payout: number | string;
  total_gross?: number | string;
  total_tax?: number | string;
  created_at: string;
}

export interface PayrollItem {
  id: number;
  payroll_run_id: number;
  employee_id: number;
  employee_code: string;
  full_name: string;
  department: string;
  job_title: string;
  pay_type: string;
  days_worked?: number;
  hours_worked?: number;
  base_pay: number | string;
  tax_deducted: number | string;
  gross_pay: number | string;
  net_pay: number | string;
  payment_status: 'pending' | 'paid';
  bank_name?: string;
  bank_account_number?: string;
  bank_ifsc?: string;
}

export interface TaxSummary {
  period: { start_date: string; end_date: string };
  tax_collected: number;
  tax_paid: number;
  net_tax_payable: number;
  invoices_count: number;
  expenses_count: number;
  total_sales: number;
  total_expenses: number;
}

export interface TaxReturn {
  id: number;
  tax_type: string;
  period_start: string;
  period_end: string;
  tax_collected: number | string;
  tax_credit: number | string;
  net_payable: number | string;
  status: string;
  due_date?: string;
  filed_at?: string;
  reference_no?: string;
  filer_name?: string;
  notes?: string;
  created_at: string;
}

export interface PnLStatement {
  period: { start_date: string; end_date: string };
  revenue: number;
  invoice_count: number;
  costs: {
    expenses: number;
    expenses_by_category: { name: string; total: number }[];
    payroll: number;
    total_costs: number;
  };
  net_profit: number;
  profit_margin: string;
}

export interface AccountantStats {
  totalRevenue: number;
  pendingExpensesCount: number;
  pendingExpensesAmount: number;
  recentExpenses: Expense[];
  latestPayroll?: PayrollRun | null;
}
