const express = require('express');
const router = express.Router();
const StockValue = require('../accounts/stock_value'); 
const BalanceSheet = require('../accounts/balancesheet'); 


async function updateBalanceSheet(asset) {
    const { date, amount } = asset;
    const recordName =  'Stock Value';

    let balanceSheetEntry = await BalanceSheet.findOne({ name: recordName });

    if (!balanceSheetEntry) {
        balanceSheetEntry = new BalanceSheet({
            name: recordName,
            category: 'Current Assets',
            amount,
            date: date
        });
        
    } else {
        balanceSheetEntry.amount += amount;
    }

    console.log(balanceSheetEntry)

    await balanceSheetEntry.save();
}


router.post('/stock-values', async (req, res) => {
    try {
        const { date, amount } = req.body;

        const newStockValue = new StockValue({
            date,
            amount
        });

        await newStockValue.save();
        await updateBalanceSheet(newStockValue)
        res.status(201).json(newStockValue);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});


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