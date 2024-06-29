const express = require('express');
const router = express.Router();
const GeneralLeger = require('../accounts/general_lenger.js');

router.post('/general-ledger', async (req, res) => {
    try {
        const { category, date, amount, description } = req.body;
        const newEntry = new GeneralLeger({ category, date, amount, description });
        await newEntry.save();
        res.status(201).json(newEntry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/general-ledger', async (req, res) => {
    try {
        const entries = await GeneralLeger.find();
        res.json(entries);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/general-ledger/:id', async (req, res) => {
    try {
        const entry = await GeneralLeger.findById(req.params.id);
        if (!entry) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        res.json(entry);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/general-ledger/:id', async (req, res) => {
    try {
        const updatedEntry = await GeneralLeger.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedEntry) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        res.json(updatedEntry);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.delete('/general-ledger/:id', async (req, res) => {
    try {
        const deletedEntry = await GeneralLeger.findByIdAndDelete(req.params.id);
        if (!deletedEntry) {
            return res.status(404).json({ message: 'Entry not found' });
        }
        res.json({ message: 'Entry deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;