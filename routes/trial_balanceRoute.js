const express = require('express');
const router = express.Router();
const Trial_Balance = require('../accounts/trial_balance.js');




router.get('/trial-balances', async (req, res) => {
    try {
        const entries = await Trial_Balance.find();
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/trial-balances/:id', async (req, res) => {
    try {
        const entry = await Trial_Balance.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ message: 'Trial balance entry not found' });
        }
        res.json(entry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/trial-balances/:id', async (req, res) => {
    try {
        const updatedEntry = await Trial_Balance.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEntry) {
            return res.status(404).json({ message: 'Trial balance entry not found' });
        }
        res.json(updatedEntry);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.delete('/trial-balances/:id', async (req, res) => {
    try {
        const deletedEntry = await Trial_Balance.findByIdAndDelete(req.params.id);
        if (!deletedEntry) {
            return res.status(404).json({ message: 'Trial balance entry not found' });
        }
        res.json({ message: 'Trial balance entry deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
