const express = require('express');
const router = express.Router();
const Item = require('../store/item');
const Variance = require('../store/variance');
const StockMovement = require('../store/stockTracker');

router.post('/variances', async (req, res) => {
    try {
        const { name, spoilt, report } = req.body;

        const item = await Item.findOne({ name });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        item.spoilt += spoilt;
        item.quantity -= spoilt;

        const updatedItem = await item.save();

        const variance = new Variance({
            itemId: item._id,
            spoilt,
            report,
            date: new Date()
        });

        await variance.save();

        const stockMovement = new StockMovement({
            itemId: item._id,
            quantity: spoilt,
            movementType: 'spoilage',
            date: new Date()
        });

        await stockMovement.save();

        res.status(201).json(variance);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/variances', async (req, res) => {
    try {
        const variances = await Variance.find().populate('itemId');
        res.json(variances);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/variances/:name', async (req, res) => {
    try {
        const { name } = req.params;

        const item = await Item.findOne({ name });
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        const variances = await Variance.find({ itemId: item._id });
        res.json(variances);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
