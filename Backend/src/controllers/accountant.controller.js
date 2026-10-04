const { pool } = require('../config/db');

// ============================================
// 1. Expense Tracking (Money Going Out)
// ============================================

const getExpenses = async (req, res) => {
  try {
    const [expenses] = await pool.query(`
      SELECT 
        e.*,
        c.name as category_name,
        c.type as category_type,
        s.name as supplier_name,
        u.full_name as recorded_by_name
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      LEFT JOIN suppliers s ON e.supplier_id = s.id
      LEFT JOIN users u ON e.recorded_by = u.id
      ORDER BY e.created_at DESC
    `);

    res.status(200).json({ success: true, data: expenses });
  } catch (error) {
    console.error('[getExpenses error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving expenses' });
  }
};

const getExpenseCategories = async (req, res) => {
  try {
    const [categories] = await pool.query('SELECT * FROM expense_categories WHERE is_active = 1 ORDER BY name ASC');
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('[getExpenseCategories error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving expense categories' });
  }
};

const getSuppliers = async (req, res) => {
  try {
    const [suppliers] = await pool.query('SELECT * FROM suppliers WHERE is_active = 1 ORDER BY name ASC');
    res.status(200).json({ success: true, data: suppliers });
  } catch (error) {
    console.error('[getSuppliers error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving suppliers' });
  }
};

const recordExpense = async (req, res) => {
  try {
    const accountantId = req.user.id;
    const {
      category_id,
      supplier_id,
      vendor_name,
      description,
      amount,
      tax_amount = 0,
      expense_date = new Date().toISOString().substring(0, 10),
      due_date
    } = req.body;

    if (!description || !amount) {
      return res.status(400).json({ success: false, message: 'Description and amount are required' });
    }

    // Constraint: status in ('unpaid', 'paid', 'void')
    const [result] = await pool.query(`
      INSERT INTO expenses (
        category_id, supplier_id, vendor_name, description, amount, tax_amount,
        expense_date, due_date, status, recorded_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unpaid', ?, NOW(), NOW())
    `, [
      category_id || 1,
      supplier_id || null,
      vendor_name || null,
      description,
      amount,
      tax_amount,
      expense_date,
      due_date || expense_date,
      accountantId
    ]);

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      expenseId: result.insertId
    });
  } catch (error) {
    console.error('[recordExpense error]', error);
    res.status(500).json({ success: false, message: 'Server error recording expense' });
  }
};

const payExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method = 'bank_transfer', reference_no = '' } = req.body;

    const [expenses] = await pool.query('SELECT * FROM expenses WHERE id = ?', [id]);
    if (expenses.length === 0) {
      return res.status(404).json({ success: false, message: 'Expense not found' });
    }

    // Constraint: payment_method in ('cash', 'card', 'upi', 'online', 'bank_transfer', 'cheque')
    const normalizedMethod = payment_method.toLowerCase().replace(/\s+/g, '_');
    const validMethod = ['cash', 'card', 'upi', 'online', 'bank_transfer', 'cheque'].includes(normalizedMethod)
      ? normalizedMethod
      : 'bank_transfer';

    await pool.query(`
      UPDATE expenses 
      SET status = 'paid', payment_method = ?, reference_no = ?, paid_at = NOW(), updated_at = NOW() 
      WHERE id = ?
    `, [validMethod, reference_no || null, id]);

    res.status(200).json({ success: true, message: 'Expense marked as paid' });
  } catch (error) {
    console.error('[payExpense error]', error);
    res.status(500).json({ success: false, message: 'Server error marking expense as paid' });
  }
};

// ============================================
// 2. Payroll (Paying the Staff)
// ============================================

const getPayrollRuns = async (req, res) => {
  try {
    const [runs] = await pool.query(`
      SELECT 
        pr.*,
        u.full_name as creator_name,
        app.full_name as approver_name,
        COALESCE((SELECT COUNT(*) FROM payroll_items WHERE payroll_run_id = pr.id), 0) as employee_count,
        COALESCE((SELECT SUM(net_pay) FROM payroll_items WHERE payroll_run_id = pr.id), 0) as total_payout,
        COALESCE((SELECT SUM(gross_pay) FROM payroll_items WHERE payroll_run_id = pr.id), 0) as total_gross,
        COALESCE((SELECT SUM(tax_deducted) FROM payroll_items WHERE payroll_run_id = pr.id), 0) as total_tax
      FROM payroll_runs pr
      LEFT JOIN users u ON pr.created_by = u.id
      LEFT JOIN users app ON pr.approved_by = app.id
      ORDER BY pr.period_month DESC
    `);

    res.status(200).json({ success: true, data: runs });
  } catch (error) {
    console.error('[getPayrollRuns error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving payroll runs' });
  }
};

const getPayrollItems = async (req, res) => {
  try {
    const { id } = req.params;

    const [items] = await pool.query(`
      SELECT 
        pi.*,
        e.employee_code,
        e.full_name,
        e.department,
        e.job_title,
        e.pay_type,
        e.bank_name,
        e.bank_account_number,
        e.bank_ifsc
      FROM payroll_items pi
      JOIN employees e ON pi.employee_id = e.id
      WHERE pi.payroll_run_id = ?
      ORDER BY e.full_name ASC
    `, [id]);

    res.status(200).json({ success: true, data: items });
  } catch (error) {
    console.error('[getPayrollItems error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving payroll items' });
  }
};

const runPayroll = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const accountantId = req.user.id;
    let targetMonth = req.body?.period_month;
    const notes = req.body?.notes || 'Monthly Payroll Run';

    // 1. If not provided or if duplicate month is requested, find appropriate period
    if (!targetMonth) {
      targetMonth = new Date().toISOString().substring(0, 7) + '-01';
    }

    // Check if payroll run already exists for this period
    const [existing] = await connection.query(
      'SELECT id, status, period_month FROM payroll_runs WHERE period_month = ?',
      [targetMonth]
    );

    let payrollRunId = null;

    await connection.beginTransaction();

    if (existing.length > 0) {
      if (existing[0].status === 'draft') {
        // Reuse existing draft run: clear items and re-calculate
        payrollRunId = existing[0].id;
        await connection.query('DELETE FROM payroll_items WHERE payroll_run_id = ?', [payrollRunId]);
        await connection.query('UPDATE payroll_runs SET notes = ?, created_at = NOW() WHERE id = ?', [notes, payrollRunId]);
      } else {
        // Already paid or approved: advance to the next monthly cycle
        const [latestRuns] = await connection.query(
          'SELECT period_month FROM payroll_runs ORDER BY period_month DESC LIMIT 1'
        );
        const baseDate = latestRuns.length > 0 ? new Date(latestRuns[0].period_month) : new Date(targetMonth);
        baseDate.setMonth(baseDate.getMonth() + 1);
        targetMonth = baseDate.toISOString().substring(0, 7) + '-01';

        const [runResult] = await connection.query(`
          INSERT INTO payroll_runs (period_month, status, created_by, notes, created_at) 
          VALUES (?, 'draft', ?, ?, NOW())
        `, [targetMonth, accountantId, `Payroll Run for ${targetMonth.substring(0, 7)}`]);
        payrollRunId = runResult.insertId;
      }
    } else {
      const [runResult] = await connection.query(`
        INSERT INTO payroll_runs (period_month, status, created_by, notes, created_at) 
        VALUES (?, 'draft', ?, ?, NOW())
      `, [targetMonth, accountantId, notes]);
      payrollRunId = runResult.insertId;
    }

    // 2. Fetch all active employees
    const [employees] = await connection.query(`
      SELECT id, full_name, pay_type, base_salary, hourly_rate 
      FROM employees 
      WHERE status = 'active'
    `);

    let totalPayrollAmount = 0;

    for (const emp of employees) {
      let grossPay = 0;
      let hoursWorked = 0;
      let daysWorked = 30;

      if (emp.pay_type === 'monthly_salary' || emp.pay_type === 'monthly') {
        grossPay = Number(emp.base_salary || 30000);
      } else if (emp.pay_type === 'hourly') {
        hoursWorked = 160; // Standard monthly hours baseline
        const hourlyRate = Number(emp.hourly_rate || 150);
        grossPay = hoursWorked * hourlyRate;
      } else {
        grossPay = Number(emp.base_salary || 25000);
      }

      // 5% standard withholding tax / TDS
      const taxDeducted = Number((grossPay * 0.05).toFixed(2));
      const netPay = Number((grossPay - taxDeducted).toFixed(2));
      totalPayrollAmount += netPay;

      // 3. Generate Payroll Items
      await connection.query(`
        INSERT INTO payroll_items (
          payroll_run_id, employee_id, days_worked, hours_worked,
          base_pay, tax_deducted, gross_pay, net_pay, payment_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [payrollRunId, emp.id, daysWorked, hoursWorked, grossPay, taxDeducted, grossPay, netPay]);
    }

    await connection.commit();

    const formattedMonth = new Date(targetMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

    res.status(201).json({
      success: true,
      message: `Payroll run generated for ${formattedMonth} (${employees.length} employees)`,
      payrollRunId,
      totalAmount: totalPayrollAmount,
      employeeCount: employees.length,
      periodMonth: targetMonth
    });
  } catch (error) {
    await connection.rollback();
    console.error('[runPayroll error]', error);
    res.status(500).json({ success: false, message: error.sqlMessage || error.message || 'Server error generating payroll' });
  } finally {
    connection.release();
  }
};

const approvePayroll = async (req, res) => {
  try {
    const accountantId = req.user.id;
    const { id } = req.params;

    const [runs] = await pool.query('SELECT * FROM payroll_runs WHERE id = ?', [id]);
    if (runs.length === 0) {
      return res.status(404).json({ success: false, message: 'Payroll run not found' });
    }

    await pool.query(`
      UPDATE payroll_runs 
      SET status = 'paid', approved_by = ?, approved_at = NOW(), paid_at = NOW() 
      WHERE id = ?
    `, [accountantId, id]);

    await pool.query(`
      UPDATE payroll_items 
      SET payment_status = 'paid', paid_at = NOW(), payment_method = 'bank_transfer' 
      WHERE payroll_run_id = ?
    `, [id]);

    res.status(200).json({ success: true, message: 'Payroll approved and disbursed successfully' });
  } catch (error) {
    console.error('[approvePayroll error]', error);
    res.status(500).json({ success: false, message: 'Server error approving payroll' });
  }
};

// ============================================
// 3. Taxes & Compliance
// ============================================

const getTaxSummary = async (req, res) => {
  try {
    const { start_date = '2026-01-01', end_date = '2026-12-31' } = req.query;

    // Tax collected from Paid Invoices
    const [salesTax] = await pool.query(`
      SELECT 
        COALESCE(SUM(tax_total), SUM(total_amount * 0.18)) as collected,
        COUNT(*) as invoices_count,
        COALESCE(SUM(total_amount), 0) as total_sales
      FROM invoices 
      WHERE status = 'paid' AND DATE(issue_date) BETWEEN ? AND ?
    `, [start_date, end_date]);

    // Tax paid on Expenses
    const [expensesTax] = await pool.query(`
      SELECT 
        COALESCE(SUM(tax_amount), 0) as paid,
        COUNT(*) as expenses_count,
        COALESCE(SUM(amount), 0) as total_expenses
      FROM expenses 
      WHERE status = 'paid' AND DATE(expense_date) BETWEEN ? AND ?
    `, [start_date, end_date]);

    const collected = Number(salesTax[0].collected || 0);
    const paid = Number(expensesTax[0].paid || 0);
    const netPayable = Number((collected - paid).toFixed(2));

    res.status(200).json({
      success: true,
      data: {
        period: { start_date, end_date },
        tax_collected: collected,
        tax_paid: paid,
        net_tax_payable: netPayable,
        invoices_count: Number(salesTax[0].invoices_count || 0),
        expenses_count: Number(expensesTax[0].expenses_count || 0),
        total_sales: Number(salesTax[0].total_sales || 0),
        total_expenses: Number(expensesTax[0].total_expenses || 0)
      }
    });
  } catch (error) {
    console.error('[getTaxSummary error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving tax summary' });
  }
};

const getTaxReturns = async (req, res) => {
  try {
    const [returns] = await pool.query(`
      SELECT 
        tr.*,
        u.full_name as filer_name
      FROM tax_returns tr
      LEFT JOIN users u ON tr.filed_by = u.id
      ORDER BY tr.period_end DESC
    `);

    res.status(200).json({ success: true, data: returns });
  } catch (error) {
    console.error('[getTaxReturns error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving tax returns' });
  }
};

const fileTaxReturn = async (req, res) => {
  try {
    const accountantId = req.user.id;
    const {
      tax_type = 'GST',
      period_start,
      period_end,
      total_tax_collected = 0,
      total_tax_paid = 0,
      net_payable = 0,
      reference_no = 'GST-' + Date.now(),
      notes = ''
    } = req.body;

    const [taxReturn] = await pool.query(`
      INSERT INTO tax_returns (
        tax_type, period_start, period_end, tax_collected, tax_credit, net_payable,
        status, due_date, filed_at, filed_by, reference_no, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'filed', CURDATE(), NOW(), ?, ?, ?, ?, NOW())
    `, [
      tax_type,
      period_start,
      period_end,
      total_tax_collected,
      total_tax_paid,
      net_payable,
      accountantId,
      reference_no,
      notes,
      accountantId
    ]);

    res.status(201).json({
      success: true,
      message: 'Tax return filed successfully',
      returnId: taxReturn.insertId,
      reference_no
    });
  } catch (error) {
    console.error('[fileTaxReturn error]', error);
    res.status(500).json({ success: false, message: 'Server error filing tax return' });
  }
};

// ============================================
// 4. Financial Reporting (P&L Statement)
// ============================================

const getPnLStatement = async (req, res) => {
  try {
    const { start_date = '2026-01-01', end_date = '2026-12-31' } = req.query;

    // 1. Revenue
    const [revenueData] = await pool.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as total_revenue,
        COUNT(*) as invoice_count
      FROM invoices 
      WHERE status = 'paid' AND DATE(issue_date) BETWEEN ? AND ?
    `, [start_date, end_date]);

    // 2. Expenses by Category
    const [expenseCategoryData] = await pool.query(`
      SELECT 
        c.name as category_name,
        COALESCE(SUM(e.amount), 0) as category_total
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      WHERE e.status = 'paid' AND DATE(e.expense_date) BETWEEN ? AND ?
      GROUP BY c.id, c.name
    `, [start_date, end_date]);

    const [expenseData] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total_expenses 
      FROM expenses 
      WHERE status = 'paid' AND DATE(expense_date) BETWEEN ? AND ?
    `, [start_date, end_date]);

    // 3. Payroll (Sum of paid items)
    const [payrollData] = await pool.query(`
      SELECT COALESCE(SUM(gross_pay), 0) as total_payroll 
      FROM payroll_items pi
      JOIN payroll_runs pr ON pi.payroll_run_id = pr.id
      WHERE pr.status IN ('approved', 'paid') AND DATE(pr.period_month) BETWEEN ? AND ?
    `, [start_date, end_date]);

    const totalRevenue = Number(revenueData[0].total_revenue || 0);
    const totalExpenses = Number(expenseData[0].total_expenses || 0);
    const totalPayroll = Number(payrollData[0].total_payroll || 0);
    const totalCosts = totalExpenses + totalPayroll;
    const netProfit = totalRevenue - totalCosts;
    const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) + '%' : '0.0%';

    res.status(200).json({
      success: true,
      data: {
        period: { start_date, end_date },
        revenue: totalRevenue,
        invoice_count: Number(revenueData[0].invoice_count || 0),
        costs: {
          expenses: totalExpenses,
          expenses_by_category: expenseCategoryData.map(c => ({
            name: c.category_name || 'General Expense',
            total: Number(c.category_total)
          })),
          payroll: totalPayroll,
          total_costs: totalCosts
        },
        net_profit: netProfit,
        profit_margin: margin
      }
    });
  } catch (error) {
    console.error('[getPnLStatement error]', error);
    res.status(500).json({ success: false, message: 'Server error generating P&L statement' });
  }
};

// ============================================
// 5. Accountant Stats (Dashboard KPIs)
// ============================================

const getStats = async (req, res) => {
  try {
    const [rev] = await pool.query(`
      SELECT COALESCE(SUM(total_amount), 0) as total_revenue
      FROM invoices
      WHERE status = 'paid'
    `);

    const [pendingExpenses] = await pool.query(`
      SELECT 
        COUNT(*) as pending_count,
        COALESCE(SUM(amount), 0) as pending_amount
      FROM expenses
      WHERE status IN ('pending', 'unpaid')
    `);

    const [recentExpenses] = await pool.query(`
      SELECT e.*, c.name as category_name
      FROM expenses e
      LEFT JOIN expense_categories c ON e.category_id = c.id
      ORDER BY e.created_at DESC
      LIMIT 5
    `);

    const [latestPayroll] = await pool.query(`
      SELECT pr.*, 
        (SELECT COUNT(*) FROM payroll_items WHERE payroll_run_id = pr.id) as emp_count,
        (SELECT COALESCE(SUM(net_pay), 0) FROM payroll_items WHERE payroll_run_id = pr.id) as total_payout
      FROM payroll_runs pr
      ORDER BY pr.period_month DESC
      LIMIT 1
    `);

    res.status(200).json({
      success: true,
      data: {
        totalRevenue: Number(rev[0].total_revenue || 0),
        pendingExpensesCount: Number(pendingExpenses[0].pending_count || 0),
        pendingExpensesAmount: Number(pendingExpenses[0].pending_amount || 0),
        recentExpenses,
        latestPayroll: latestPayroll.length > 0 ? latestPayroll[0] : null
      }
    });
  } catch (error) {
    console.error('[accountant getStats error]', error);
    res.status(500).json({ success: false, message: 'Server error retrieving accountant stats' });
  }
};

module.exports = {
  getExpenses,
  getExpenseCategories,
  getSuppliers,
  recordExpense,
  payExpense,
  getPayrollRuns,
  getPayrollItems,
  runPayroll,
  approvePayroll,
  getTaxSummary,
  getTaxReturns,
  fileTaxReturn,
  getPnLStatement,
  getStats
};
