const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const StockValue = require('../accounts/stock_value'); 
const BalanceSheet = require('../accounts/balancesheet'); 
const Item = require('../store/item'); 
const cron = require('node-cron');



async function calculateAndPostStockValue() {
    try {

        const items = await Item.find();
        const totalStockValue = items.reduce((acc, item) => acc + (item.quantity * item.unit_price), 0);


        const stockValue = new StockValue({
            date: new Date(),
            amount: totalStockValue
        });

        await stockValue.save();

        const recordName = 'Stock Value';
        let balanceSheetEntry = await BalanceSheet.findOne({ name: recordName });

        if (!balanceSheetEntry) {
            balanceSheetEntry = new BalanceSheet({
                name: recordName,
                category: 'Current Assets',
                amount: totalStockValue,
                date: new Date()
            });
        } else {
            balanceSheetEntry.amount = totalStockValue; 
            balanceSheetEntry.date = new Date(); 
        }

        await balanceSheetEntry.save();

        console.log('Stock value calculated and posted successfully:', totalStockValue);
    } catch (err) {
        console.error('Error calculating and posting stock value:', err);
    }
}


calculateAndPostStockValue();

cron.schedule('0 0 * * *', () => {
    calculateAndPostStockValue();
});
router.get('/stock-values', async (req, res) => {
    try {
        const stockValues = await StockValue.find();
        res.json(stockValues);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/stock-values/:date', async (req, res) => {
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
