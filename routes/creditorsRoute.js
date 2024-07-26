const express = require('express');
const router = express.Router();
const Creditors = require('../accounts/creditors');
const TrialBalance = require('../accounts/trial_balance');
const BalanceSheet = require('../accounts/balancesheet');

router.post('/creditors', async (req, res) => {
    try {
        const { vendor, date, amount } = req.body;

        const newCreditor = new Creditors({
            vendor,
            date,
            amount
        });


        const currentYear = new Date().getFullYear(); 

        let trialBalanceEntry = await TrialBalance.findOne({
            group_name: 'Creditors',
            Date: {
                $gte: new Date(currentYear, 0, 1),
                $lt: new Date(currentYear + 1, 0, 1)
            }
        });

        if (!trialBalanceEntry) {
            trialBalanceEntry = new TrialBalance({
                group_name: 'Creditors',
                Debit: 0,
                Credit: amount,
                Date: new Date()
            });
        } else {
            trialBalanceEntry.Credit += amount;  
        }

        await trialBalanceEntry.save();


        let balanceSheetEntry = await BalanceSheet.findOne({
            name: 'Short Term Loans',
            category: 'Short Term Liabilities',
            date: {
                $gte: new Date(currentYear, 0, 1),
                $lt: new Date(currentYear + 1, 0, 1)
            }
        });

        if (!balanceSheetEntry) {
            balanceSheetEntry = new BalanceSheet({
                name: 'Short Term Loans',
                category: 'Short Term Liabilities',
                amount: amount,
                date: new Date()
            });
        } else {
            balanceSheetEntry.amount += amount;
        }

        await balanceSheetEntry.save();

        // Save new Creditor entry
        await newCreditor.save();

        res.status(201).json(newCreditor);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/creditors', async (req, res) => {
    try {
        const creditors = await Creditors.find();
        res.json(creditors);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/creditors/:id', async (req, res) => {
    try {
        const creditor = await Creditors.findById(req.params.id);
        if (!creditor) {
            return res.status(404).json({ message: 'Creditor not found' });
        }
        res.json(creditor);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/creditors/:id', async (req, res) => {
    try {
        const deletedCreditor = await Creditors.findByIdAndDelete(req.params.id);
        if (!deletedCreditor) {
            return res.status(404).json({ message: 'Creditor not found' });
        }
        res.json({ message: 'Creditor deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
