const db = require('../config/db.js');

// ============================================
// 1. Expense Tracking (Money Going Out)
// ============================================

const recordExpense = async (req, res) => {
  try {
    const accountantId = req.user.id;
    const { category_id, supplier_id, description, amount, tax_amount, due_date } = req.body;

    const [expense] = await db.query(
      `INSERT INTO expenses (category_id, supplier_id, description, amount, tax_amount, status, due_date, logged_by, created_at) 
       VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, NOW())`,
      [category_id, supplier_id || null, description, amount, tax_amount || 0, due_date, accountantId]
    );

    res.status(201).json({ success: true, message: 'Expense recorded successfully', expenseId: expense.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const payExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const { payment_method, reference_no } = req.body; // e.g. "Bank Transfer", "Cheque"

    await db.query(
      'UPDATE expenses SET status = "Paid", payment_method = ?, reference_no = ?, payment_date = NOW(), updated_at = NOW() WHERE id = ?',
      [payment_method, reference_no || null, id]
    );

    res.status(200).json({ success: true, message: 'Expense marked as paid' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 2. Payroll (Paying the Staff)
// ============================================

const runPayroll = async (req, res) => {
  try {
    const accountantId = req.user.id;
    const { start_date, end_date } = req.body;

    // 1. Create a Payroll Run
    const [runResult] = await db.query(
      'INSERT INTO payroll_runs (start_date, end_date, status, processed_by, created_at) VALUES (?, ?, "Draft", ?, NOW())',
      [start_date, end_date, accountantId]
    );
    const payrollRunId = runResult.insertId;

    // 2. Fetch all active employees
    const [employees] = await db.query('SELECT id, hourly_rate, salary FROM employees WHERE status = "Active"');

    let totalPayrollAmount = 0;

    for (const emp of employees) {
      let gross_pay = 0;
      let deductions = 0; // Simple stub for deductions (unpaid leave, etc.)

      if (emp.salary) {
        // If salaried, calculate pro-rata based on days or just standard monthly divided
        // For simplicity, we assume salary is monthly and we are running a monthly payroll
        gross_pay = emp.salary;
      } else if (emp.hourly_rate) {
        // Fetch logged attendance hours for the period
        const [attendance] = await db.query(`
          SELECT SUM(TIMESTAMPDIFF(HOUR, check_in_time, check_out_time)) as total_hours 
          FROM attendance_records 
          WHERE employee_id = ? AND DATE(check_in_time) BETWEEN ? AND ?
        `, [emp.id, start_date, end_date]);

        const hours = attendance[0].total_hours || 0;
        gross_pay = hours * emp.hourly_rate;
      }

      // Check for unpaid leaves (dummy logic for demonstration)
      const [leaves] = await db.query(`
        SELECT COUNT(*) as unpaid_days 
        FROM leave_requests 
        WHERE employee_id = ? AND status = 'Approved' AND leave_type_id = (SELECT id FROM leave_types WHERE name = 'Unpaid' LIMIT 1)
        AND start_date >= ? AND end_date <= ?
      `, [emp.id, start_date, end_date]);
      
      const unpaidDays = leaves[0]?.unpaid_days || 0;
      deductions = unpaidDays * (emp.salary ? (emp.salary / 30) : 0);

      const net_pay = gross_pay - deductions;
      totalPayrollAmount += net_pay;

      // 3. Generate Payroll Items (Payslips)
      await db.query(
        'INSERT INTO payroll_items (payroll_run_id, employee_id, gross_pay, deductions, net_pay, status) VALUES (?, ?, ?, ?, ?, "Pending")',
        [payrollRunId, emp.id, gross_pay, deductions, net_pay]
      );
    }

    // Update total amount on the Run
    await db.query('UPDATE payroll_runs SET total_amount = ? WHERE id = ?', [totalPayrollAmount, payrollRunId]);

    res.status(201).json({ success: true, message: 'Payroll calculated and Draft generated', payrollRunId, totalAmount: totalPayrollAmount });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const approvePayroll = async (req, res) => {
  try {
    const { id } = req.params; // payroll_run_id

    await db.query('UPDATE payroll_runs SET status = "Approved", approved_at = NOW() WHERE id = ?', [id]);
    await db.query('UPDATE payroll_items SET status = "Paid" WHERE payroll_run_id = ?', [id]);

    res.status(200).json({ success: true, message: 'Payroll approved and locked for disbursement' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 3. Taxes & Compliance
// ============================================

const getTaxSummary = async (req, res) => {
  try {
    const { start_date, end_date } = req.query; // format: YYYY-MM-DD

    // Tax collected from Invoices (Sales)
    const [salesTax] = await db.query(`
      SELECT SUM(amount * 0.18) as collected -- Simple 18% dummy GST logic
      FROM invoices 
      WHERE status = 'Paid' AND DATE(issue_date) BETWEEN ? AND ?
    `, [start_date, end_date]);

    // Tax paid on Expenses (Purchases)
    const [expensesTax] = await db.query(`
      SELECT SUM(tax_amount) as paid 
      FROM expenses 
      WHERE status = 'Paid' AND DATE(payment_date) BETWEEN ? AND ?
    `, [start_date, end_date]);

    const collected = salesTax[0].collected || 0;
    const paid = expensesTax[0].paid || 0;
    const netPayable = collected - paid;

    res.status(200).json({ 
      success: true, 
      data: {
        period: { start_date, end_date },
        tax_collected: collected,
        tax_paid: paid,
        net_tax_payable: netPayable
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const fileTaxReturn = async (req, res) => {
  try {
    const accountantId = req.user.id;
    const { period_start, period_end, total_tax_collected, total_tax_paid, net_payable, reference_no } = req.body;

    const [taxReturn] = await db.query(
      `INSERT INTO tax_returns (period_start, period_end, total_tax_collected, total_tax_paid, net_payable, status, filed_by, reference_no, created_at) 
       VALUES (?, ?, ?, ?, ?, 'Filed', ?, ?, NOW())`,
      [period_start, period_end, total_tax_collected, total_tax_paid, net_payable, accountantId, reference_no]
    );

    res.status(201).json({ success: true, message: 'Tax return filed successfully', returnId: taxReturn.insertId });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ============================================
// 4. Financial Reporting
// ============================================

const getPnLStatement = async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    // 1. Revenue (Sum of all paid invoices)
    const [revenueData] = await db.query(`
      SELECT SUM(total_amount) as revenue 
      FROM invoices 
      WHERE status = 'Paid' AND DATE(issue_date) BETWEEN ? AND ?
    `, [start_date, end_date]);

    // 2. Expenses (Sum of all paid bills/expenses)
    const [expenseData] = await db.query(`
      SELECT SUM(amount) as expenses 
      FROM expenses 
      WHERE status = 'Paid' AND DATE(payment_date) BETWEEN ? AND ?
    `, [start_date, end_date]);

    // 3. Payroll (Sum of all approved payroll runs)
    const [payrollData] = await db.query(`
      SELECT SUM(total_amount) as payroll 
      FROM payroll_runs 
      WHERE status = 'Approved' AND end_date BETWEEN ? AND ?
    `, [start_date, end_date]);

    const totalRevenue = Number(revenueData[0].revenue || 0);
    const totalExpenses = Number(expenseData[0].expenses || 0);
    const totalPayroll = Number(payrollData[0].payroll || 0);

    const netProfit = totalRevenue - (totalExpenses + totalPayroll);

    res.status(200).json({
      success: true,
      data: {
        period: { start_date, end_date },
        revenue: totalRevenue,
        costs: {
          expenses: totalExpenses,
          payroll: totalPayroll,
          total_costs: totalExpenses + totalPayroll
        },
        net_profit: netProfit,
        profit_margin_percent: totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(2) + '%' : '0%'
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  recordExpense,
  payExpense,
  runPayroll,
  approvePayroll,
  getTaxSummary,
  fileTaxReturn,
  getPnLStatement
};
