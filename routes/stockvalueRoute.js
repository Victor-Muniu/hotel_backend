const express = require('express');
const router = express.Router();
const StockValue = require('../accounts/stock_value'); 


router.get('/stockValues', async (req, res) => {
    try {
        const stockValues = await StockValue.find();
        res.json(stockValues);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/stockValues/:date', async (req, res) => {
    try {
        const { date } = req.params;
        const stockValue = await StockValue.findOne({ date: new Date(date) });
        if (!stockValue) {
            return res.status(404).json({ message: 'Stock value not found for the given date' });
        }
        res.json(stockValue);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;