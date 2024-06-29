const express = require('express');
const router = express.Router();
const Consolidated_purchases = require('../accounts/consolidated_purchases');
const TrialBalance = require('../accounts/trial_balance'); 
const ProfitLoss = require('../accounts/profit&loss');

router.post('/consolidated-purchases', async (req, res) => {
    try {
        const { category, date, amount } = req.body;
        const newEntry = new Consolidated_purchases({ category, date, amount });
        await newEntry.save();

        await updateFinancials('Purchases', amount, new Date(date), 'debit');

        res.status(201).json(newEntry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/consolidated-purchases', async (req, res) => {
    try {
        const entries = await Consolidated_purchases.find();
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/consolidated-purchases/:id', async (req, res) => {
    try {
        const entry = await Consolidated_purchases.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ message: 'Consolidated purchase entry not found' });
        }
        res.json(entry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/consolidated-purchases/:id', async (req, res) => {
    try {
        const updatedEntry = await Consolidated_purchases.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEntry) {
            return res.status(404).json({ message: 'Consolidated purchase entry not found' });
        }
        res.json(updatedEntry);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/consolidated-purchases/:id', async (req, res) => {
    try {
        const deletedEntry = await Consolidated_purchases.findByIdAndDelete(req.params.id);
        if (!deletedEntry) {
            return res.status(404).json({ message: 'Consolidated purchase entry not found' });
        }
        res.json({ message: 'Consolidated purchase entry deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

async function updateFinancials(groupName, amount, date, transactionType) {
    const year = date.getFullYear();

    let trialBalanceEntry = await TrialBalance.findOne({ group_name: groupName, Date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } });
    let profitLossEntry = await ProfitLoss.findOne({ group_name: groupName, Date: { $gte: new Date(year, 0, 1), $lt: new Date(year + 1, 0, 1) } });

    if (!trialBalanceEntry) {
        trialBalanceEntry = new TrialBalance({
            group_name: groupName,
            Debit: transactionType === 'debit' ? amount : 0,
            Credit: transactionType === 'credit' ? amount : 0,
            Date: new Date(year, 0, 1)
        });
    } else {
        trialBalanceEntry.Debit += transactionType === 'debit' ? amount : 0;
        trialBalanceEntry.Credit += transactionType === 'credit' ? amount : 0;
    }

    if (!profitLossEntry) {
        profitLossEntry = new ProfitLoss({
            group_name: groupName,
            Debit: transactionType === 'debit' ? amount : 0,
            Credit: transactionType === 'credit' ? amount : 0,
            Date: new Date(year, 0, 1)
        });
    } else {
        profitLossEntry.Debit += transactionType === 'debit' ? amount : 0;
        profitLossEntry.Credit += transactionType === 'credit' ? amount : 0;
    }

    await trialBalanceEntry.save();
    await profitLossEntry.save();
}

module.exports = router;
