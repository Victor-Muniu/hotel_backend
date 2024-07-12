const express = require('express');
const router = express.Router();
const CarrageInward = require('../accounts/carriage_Inwards');
const Expense = require('../accounts/expense');
const GeneralLedger = require('../accounts/general_lenger');


router.post('/carrage-inwards', async (req, res) => {
    try {
        const { name, date, amount } = req.body;

        const newCarrageInward = new CarrageInward({ name, date, amount });
        await newCarrageInward.save();

        const newExpense = new Expense({ category: name, amount, date });
        await newExpense.save();

        const newGeneralLedger = new GeneralLedger({ category: name, amount, date });
        await newGeneralLedger.save();

        res.status(201).json(newCarrageInward);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


router.get('/carrage-inwards', async (req, res) => {
    try {
        const carrageInwards = await CarrageInward.find();
        res.json(carrageInwards);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/carrage-inwards/:id', async (req, res) => {
    try {
        const carrageInward = await CarrageInward.findById(req.params.id);
        if (!carrageInward) {
            return res.status(404).json({ message: 'Carrage Inward not found' });
        }
        res.json(carrageInward);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/carrage-inwards/:id', async (req, res) => {
    try {
        const carrageInward = await CarrageInward.findById(req.params.id);
        if (!carrageInward) {
            return res.status(404).json({ message: 'Carrage Inward not found' });
        }

        const { name, date, amount } = req.body;
        if (name !== undefined) carrageInward.name = name;
        if (date !== undefined) carrageInward.date = date;
        if (amount !== undefined) carrageInward.amount = amount;

        await carrageInward.save();

        await Expense.updateMany({ category: name }, { amount, date });
        await GeneralLedger.updateMany({ category: name }, { amount, date });

        res.json(carrageInward);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/carrage-inwards/:id', async (req, res) => {
    try {
        const carrageInward = await CarrageInward.findById(req.params.id);
        if (!carrageInward) {
            return res.status(404).json({ message: 'Carrage Inward not found' });
        }

        await carrageInward.deleteOne();

        await Expense.deleteMany({ category: carrageInward.name, date: carrageInward.date, amount: carrageInward.amount });
        await GeneralLedger.deleteMany({ category: carrageInward.name, date: carrageInward.date, amount: carrageInward.amount });

        res.json({ message: 'Carrage Inward deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
