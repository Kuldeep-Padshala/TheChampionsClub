import api from '../api/client';
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

export const accountantService = {
  async getStats(): Promise<AccountantStats> {
    const res = await api.get('/accountant/stats');
    return res.data.data;
  },

  async getExpenses(): Promise<Expense[]> {
    const res = await api.get('/accountant/expenses');
    return res.data.data || [];
  },

  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    const res = await api.get('/accountant/expense-categories');
    return res.data.data || [];
  },

  async getSuppliers(): Promise<Supplier[]> {
    const res = await api.get('/accountant/suppliers');
    return res.data.data || [];
  },

  async recordExpense(data: {
    category_id: number;
    supplier_id?: number | null;
    vendor_name?: string;
    description: string;
    amount: number;
    tax_amount?: number;
    expense_date?: string;
    due_date?: string;
  }): Promise<{ message: string; expenseId: number }> {
    const res = await api.post('/accountant/expenses', data);
    return res.data;
  },

  async payExpense(id: number, data: { payment_method: string; reference_no?: string }): Promise<{ message: string }> {
    const res = await api.patch(`/accountant/expenses/${id}/pay`, data);
    return res.data;
  },

  async getPayrollRuns(): Promise<PayrollRun[]> {
    const res = await api.get('/accountant/payroll/runs');
    return res.data.data || [];
  },

  async getPayrollItems(runId: number): Promise<PayrollItem[]> {
    const res = await api.get(`/accountant/payroll/runs/${runId}/items`);
    return res.data.data || [];
  },

  async runPayroll(data?: { period_month?: string; notes?: string }): Promise<{
    message: string;
    payrollRunId: number;
    totalAmount: number;
    employeeCount: number;
  }> {
    const res = await api.post('/accountant/payroll/run', data || {});
    return res.data;
  },

  async approvePayroll(runId: number): Promise<{ message: string }> {
    const res = await api.patch(`/accountant/payroll/runs/${runId}/approve`);
    return res.data;
  },

  async getTaxSummary(params?: { start_date?: string; end_date?: string }): Promise<TaxSummary> {
    const res = await api.get('/accountant/taxes/summary', { params });
    return res.data.data;
  },

  async getTaxReturns(): Promise<TaxReturn[]> {
    const res = await api.get('/accountant/taxes/returns');
    return res.data.data || [];
  },

  async fileTaxReturn(data: {
    tax_type?: string;
    period_start: string;
    period_end: string;
    total_tax_collected: number;
    total_tax_paid: number;
    net_payable: number;
    reference_no?: string;
    notes?: string;
  }): Promise<{ message: string; returnId: number; reference_no: string }> {
    const res = await api.post('/accountant/taxes/returns', data);
    return res.data;
  },

  async getPnLStatement(params?: { start_date?: string; end_date?: string }): Promise<PnLStatement> {
    const res = await api.get('/accountant/reports/pnl', { params });
    return res.data.data;
  },
};
