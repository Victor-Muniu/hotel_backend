const express = require('express');
const router = express.Router();
const CheffsLadder = require('../food_production/chefsLadder');

function calculateStocks(doc) {
    const total = doc.opening_stock + doc.issued;
    const closing_stock = total - doc.RT - doc.sold;
    return { total, closing_stock };
}


router.post('/cheffsLadder', async (req, res) => {
    try {
        const {name, unit, date, opening_stock, issued, RT, sold, shift, remarks } = req.body;
        const { total, closing_stock } = calculateStocks(req.body);

        const newLadder = new CheffsLadder({
            ...req.body,
            total,
            closing_stock
        });

        await newLadder.save();
        res.status(201).json(newLadder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/cheffsLadder', async (req, res) => {
    try {
        const ladders = await CheffsLadder.find();
        res.json(ladders);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/cheffsLadder/:id', async (req, res) => {
    try {
        const ladder = await CheffsLadder.findById(req.params.id);
        if (!ladder) return res.status(404).json({ message: 'CheffsLadder not found' });
        res.json(ladder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.patch('/cheffsLadder/:id', async (req, res) => {
    try {
        const ladder = await CheffsLadder.findById(req.params.id);
        if (!ladder) return res.status(404).json({ message: 'CheffsLadder not found' });

        Object.assign(ladder, req.body);
        const { total, closing_stock } = calculateStocks(ladder);
        ladder.total = total;
        ladder.closing_stock = closing_stock;

        const updatedLadder = await ladder.save();
        res.json(updatedLadder);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/cheffsLadder/:id', async (req, res) => {
    try {
        const ladder = await CheffsLadder.findById(req.params.id);
        if (!ladder) return res.status(404).json({ message: 'CheffsLadder not found' });

        await ladder.deleteOne();
        res.json({ message: 'CheffsLadder deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
