const express = require('express');
const router = express.Router();
const BalanceSheet = require('../accounts/balancesheet');


router.post('/balancesheet', async (req, res) => {
    try {
        const { name, category, amount, date } = req.body;

        if (!name || !category || !amount || !date) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        const newBalanceSheetEntry = new BalanceSheet({
            name,
            category,
            amount,
            date
        });

        await newBalanceSheetEntry.save();
        res.status(201).json(newBalanceSheetEntry);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/balancesheet', async (req, res) => {
    try {
        const balanceSheetEntries = await BalanceSheet.find();
        res.json(balanceSheetEntries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/balancesheet/:id', async (req, res) => {
    try {
        const balanceSheetEntry = await BalanceSheet.findById(req.params.id);
        if (!balanceSheetEntry) {
            return res.status(404).json({ message: 'Balance sheet entry not found' });
        }
        res.json(balanceSheetEntry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/balancesheet/:id', async (req, res) => {
    try {
        const updates = req.body;

        if (updates.name !== undefined || updates.category !== undefined || updates.amount !== undefined || updates.date !== undefined) {
            const balanceSheetEntry = await BalanceSheet.findById(req.params.id);
            if (!balanceSheetEntry) {
                return res.status(404).json({ message: 'Balance sheet entry not found' });
            }

            Object.assign(balanceSheetEntry, updates);
            await balanceSheetEntry.save();

            res.json(balanceSheetEntry);
        } else {
            res.status(400).json({ message: 'No valid fields to update' });
        }
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/balancesheet/:id', async (req, res) => {
    try {
        const deletedBalanceSheetEntry = await BalanceSheet.findByIdAndDelete(req.params.id);
        if (!deletedBalanceSheetEntry) {
            return res.status(404).json({ message: 'Balance sheet entry not found' });
        }
        res.json({ message: 'Balance sheet entry deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
