const express = require('express');
const router = express.Router();
const Expense = require('../accounts/expense');
const GeneralLedger = require('../accounts/general_lenger');
const TrialBalance = require('../accounts/trial_balance');
const ProfitLoss = require('../accounts/profit&loss');

router.post('/expenses', async (req, res) => {
    try {
        const newExpense = new Expense(req.body);
        await newExpense.save();
        await updateMonthlyLedger(newExpense);
        await updateTrialBalance(newExpense);
        await updateProfitLoss(newExpense);

        res.status(201).json(newExpense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

async function updateMonthlyLedger(expense) {
    const { date, amount } = expense;

    const expenseMonth = date.getMonth();
    const expenseYear = date.getFullYear();

    let ledgerEntry = await GeneralLedger.findOne({ category: `${expenseYear}-${expenseMonth}` });

    if (!ledgerEntry) {
        ledgerEntry = new GeneralLedger({
            category: 'Expense',
            date: new Date(),
            amount: amount,
        });
    } else {
        ledgerEntry.amount += amount;
    }

    await ledgerEntry.save();
}

async function updateTrialBalance(expense) {
    const currentYear = new Date().getFullYear();
    const { amount } = expense;

    let trialBalanceEntry = await TrialBalance.findOne({
        group_name: 'Expense',
        Date: { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) }
    });

    if (!trialBalanceEntry) {
        trialBalanceEntry = new TrialBalance({
            group_name: 'Expense',
            Debit: amount,
            Credit: 0,
            Date: new Date()
        });
    } else {
        trialBalanceEntry.Debit += amount;
    }

    await trialBalanceEntry.save();
}

async function updateProfitLoss(expense) {
    const currentYear = new Date().getFullYear();
    const { amount } = expense;

    let profitLossEntry = await ProfitLoss.findOne({
        group_name: 'Expense',
        Date: { $gte: new Date(currentYear, 0, 1), $lt: new Date(currentYear + 1, 0, 1) }
    });

    if (!profitLossEntry) {
        profitLossEntry = new ProfitLoss({
            group_name: 'Expense',
            Debit: amount,
            Credit: 0,
            Date: new Date()
        });
    } else {
        profitLossEntry.Debit += amount;
    }

    await profitLossEntry.save();
}

router.get('/expenses', async (req, res) => {
    try {
        const expenses = await Expense.find();
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/expenses/:id', async (req, res) => {
    try {
        const expense = await Expense.findById(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.json(expense);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/expenses/:id', async (req, res) => {
    try {
        const updatedExpense = await Expense.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedExpense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.json(updatedExpense);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/expenses/:id', async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense) {
            return res.status(404).json({ message: 'Expense not found' });
        }
        res.json({ message: 'Expense deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
