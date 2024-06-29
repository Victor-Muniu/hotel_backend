const express = require('express');
const router = express.Router();
const StockMovement = require('../store/stockTracker');
const Item = require('../store/item');

router.post('/stockMovements', async (req, res) => {
    try {
        const stockMovement = new StockMovement(req.body);
        await stockMovement.save();

        const item = await Item.findById(stockMovement.itemId);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (stockMovement.movementType === 'purchase' || stockMovement.movementType === 'transfer') {
            item.quantity += stockMovement.quantity;
        } else if (stockMovement.movementType === 'sale' || stockMovement.movementType === 'spoilage') {
            item.quantity -= stockMovement.quantity;
        }

        item.value = item.quantity * item.unit_price;
        await item.save();

        res.status(201).json(stockMovement);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.get('/stockMovements', async (req, res) => {
    try {
        const stockMovements = await StockMovement.find().populate('itemId');
        res.json(stockMovements);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.get('/stockMovements/report/:period', async (req, res) => {
    const period = req.params.period;
    let startDate;
    const endDate = new Date();

    switch (period) {
        case 'weekly':
            startDate = new Date();
            startDate.setDate(endDate.getDate() - 7);
            break;
        case 'monthly':
            startDate = new Date();
            startDate.setMonth(endDate.getMonth() - 1);
            break;
        case 'yearly':
            startDate = new Date();
            startDate.setFullYear(endDate.getFullYear() - 1);
            break;
        default:
            return res.status(400).json({ message: 'Invalid period' });
    }

    try {
        const stockMovements = await StockMovement.find({
            date: { $gte: startDate, $lte: endDate }
        }).populate('itemId');

        const report = stockMovements.reduce((acc, movement) => {
            const { itemId, quantity, movementType } = movement;
            if (!acc[itemId.name]) {
                acc[itemId.name] = { purchase: 0, sale: 0, spoilage: 0, transfer: 0 };
            }
            acc[itemId.name][movementType] += quantity;
            return acc;
        }, {});

        res.json(report);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
