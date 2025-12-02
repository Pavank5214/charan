const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const Expense = require('../models/Expense');
const auth = require('../middleware/auth');

// GET Financial Summary based on date range
router.get('/summary', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const companyId = req.user.currentCompanyId;

    // Build Date Query
    const dateQuery = {};
    if (startDate && endDate) {
      dateQuery.$gte = new Date(startDate);
      dateQuery.$lte = new Date(endDate);
    } else {
      // Default to this month
      const now = new Date();
      dateQuery.$gte = new Date(now.getFullYear(), now.getMonth(), 1);
      dateQuery.$lte = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    // 1. Calculate Revenue (From Invoices)
    // We consider 'paid' invoices for realized revenue, but 'total' for accrued revenue
    const invoices = await Invoice.find({
      companyId,
      invoiceDate: dateQuery
    });

    const totalInvoiced = invoices.reduce((acc, inv) => acc + (inv.total || 0), 0);
    const totalCollected = invoices
      .filter(inv => inv.status === 'paid')
      .reduce((acc, inv) => acc + (inv.total || 0), 0);
    
    // Calculate GST Collected (Output Tax)
    // Assuming gstRate is stored in invoice or calculated from total
    // This is an estimation: (Total - Subtotal)
    const gstCollected = invoices.reduce((acc, inv) => {
       const tax = (inv.total || 0) - (inv.subtotal || 0);
       return acc + tax;
    }, 0);

    // 2. Calculate Expenses
    const expenses = await Expense.find({
      companyId,
      date: dateQuery
    });

    const totalExpenses = expenses.reduce((acc, exp) => acc + (exp.amount || 0), 0);

    // Expense Breakdown by Category
    const expenseByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    // 3. Net Profit
    // Profit = Invoiced Revenue - Expenses (Accrual basis)
    const netProfit = totalInvoiced - totalExpenses;

    res.json({
      overview: {
        totalInvoiced,
        totalCollected,
        totalExpenses,
        netProfit,
        gstCollected
      },
      expenseByCategory,
      invoiceCount: invoices.length,
      expenseCount: expenses.length
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;